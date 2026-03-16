/// The Record — On-chain record registry and license marketplace
/// 
/// This module handles:
/// 1. Record registration — permanent on-chain commitment of content hashes
/// 2. License purchase — atomic payment split between publisher and platform
/// 3. License verification — anyone can verify a license on-chain
module the_record::record_registry {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::timestamp;

    // ── Error codes ────────────────────────────────────────────────────────────
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_REGISTERED: u64 = 2;
    const E_RECORD_NOT_FOUND: u64 = 3;
    const E_INSUFFICIENT_PAYMENT: u64 = 4;
    const E_INVALID_TIER: u64 = 5;
    const E_NOT_PLATFORM: u64 = 6;
    const E_ALREADY_LICENSED: u64 = 7;

    // ── License tiers ──────────────────────────────────────────────────────────
    const TIER_VIEW: u8 = 1;
    const TIER_CITE: u8 = 2;
    const TIER_LICENSE: u8 = 3;

    // ── Platform fee: 10% ─────────────────────────────────────────────────────
    const PLATFORM_FEE_BPS: u64 = 1000; // basis points (1000 = 10%)
    const BPS_DENOMINATOR: u64 = 10000;

    // ── Structs ────────────────────────────────────────────────────────────────

    struct Record has store, drop, copy {
        slug: String,
        content_hash: String,     // SHA-256 of content
        shelby_blob_name: String, // Shelby Protocol blob reference
        publisher: address,
        price_view: u64,          // in octas
        price_cite: u64,
        price_license: u64,
        registered_at: u64,       // timestamp micros
        is_active: bool,
    }

    struct License has store, drop, copy {
        record_slug: String,
        licensee: address,
        tier: u8,
        price_paid: u64,
        licensed_at: u64,
        tx_hash: String,          // stored for citation proof
    }

    struct RecordRegisteredEvent has drop, store {
        slug: String,
        content_hash: String,
        publisher: address,
        registered_at: u64,
    }

    struct LicensePurchasedEvent has drop, store {
        record_slug: String,
        licensee: address,
        publisher: address,
        tier: u8,
        price_paid: u64,
        platform_fee: u64,
        purchased_at: u64,
    }

    struct Registry has key {
        records: vector<Record>,
        record_registered_events: EventHandle<RecordRegisteredEvent>,
        license_purchased_events: EventHandle<LicensePurchasedEvent>,
        platform_address: address,
        total_records: u64,
        total_licenses: u64,
        total_volume: u64,
    }

    struct UserLicenses has key {
        licenses: vector<License>,
    }

    // ── Initialization ─────────────────────────────────────────────────────────

    /// Initialize the registry — called once by the platform account
    public entry fun initialize(platform: &signer) {
        let platform_addr = signer::address_of(platform);
        assert!(!exists<Registry>(platform_addr), E_ALREADY_REGISTERED);

        move_to(platform, Registry {
            records: vector::empty<Record>(),
            record_registered_events: account::new_event_handle<RecordRegisteredEvent>(platform),
            license_purchased_events: account::new_event_handle<LicensePurchasedEvent>(platform),
            platform_address: platform_addr,
            total_records: 0,
            total_licenses: 0,
            total_volume: 0,
        });
    }

    // ── Record registration ────────────────────────────────────────────────────

    /// Register a new record on-chain
    /// Called by publishers after uploading to Shelby
    public entry fun register_record(
        publisher: &signer,
        platform_addr: address,
        slug: String,
        content_hash: String,
        shelby_blob_name: String,
        price_view: u64,
        price_cite: u64,
        price_license: u64,
    ) acquires Registry {
        assert!(exists<Registry>(platform_addr), E_NOT_INITIALIZED);
        let registry = borrow_global_mut<Registry>(platform_addr);

        // Ensure slug is unique
        let len = vector::length(&registry.records);
        let i = 0;
        while (i < len) {
            let record = vector::borrow(&registry.records, i);
            assert!(record.slug != slug, E_ALREADY_REGISTERED);
            i = i + 1;
        };

        let now = timestamp::now_microseconds();
        let publisher_addr = signer::address_of(publisher);

        let record = Record {
            slug,
            content_hash,
            shelby_blob_name,
            publisher: publisher_addr,
            price_view,
            price_cite,
            price_license,
            registered_at: now,
            is_active: true,
        };

        event::emit_event(&mut registry.record_registered_events, RecordRegisteredEvent {
            slug: record.slug,
            content_hash: record.content_hash,
            publisher: publisher_addr,
            registered_at: now,
        });

        vector::push_back(&mut registry.records, record);
        registry.total_records = registry.total_records + 1;
    }

    // ── License purchase ───────────────────────────────────────────────────────

    /// Purchase a license for a record
    /// Atomically splits payment between publisher (90%) and platform (10%)
    public entry fun purchase_license(
        buyer: &signer,
        platform_addr: address,
        record_slug: String,
        tier: u8,
    ) acquires Registry, UserLicenses {
        assert!(exists<Registry>(platform_addr), E_NOT_INITIALIZED);
        assert!(tier >= TIER_VIEW && tier <= TIER_LICENSE, E_INVALID_TIER);

        let registry = borrow_global_mut<Registry>(platform_addr);
        let buyer_addr = signer::address_of(buyer);

        // Find record
        let len = vector::length(&registry.records);
        let i = 0;
        let found = false;
        let publisher_addr = @the_record;
        let price: u64 = 0;

        while (i < len) {
            let record = vector::borrow(&registry.records, i);
            if (record.slug == record_slug) {
                found = true;
                publisher_addr = record.publisher;
                price = if (tier == TIER_VIEW) {
                    record.price_view
                } else if (tier == TIER_CITE) {
                    record.price_cite
                } else {
                    record.price_license
                };
                break
            };
            i = i + 1;
        };

        assert!(found, E_RECORD_NOT_FOUND);

        // Calculate split
        let platform_fee = (price * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        let publisher_share = price - platform_fee;

        // Execute atomic payments
        if (publisher_share > 0) {
            coin::transfer<AptosCoin>(buyer, publisher_addr, publisher_share);
        };
        if (platform_fee > 0) {
            coin::transfer<AptosCoin>(buyer, platform_addr, platform_fee);
        };

        let now = timestamp::now_microseconds();

        // Record the license
        let license = License {
            record_slug,
            licensee: buyer_addr,
            tier,
            price_paid: price,
            licensed_at: now,
            tx_hash: string::utf8(b""),
        };

        // Store license on buyer's account
        if (!exists<UserLicenses>(buyer_addr)) {
            move_to(buyer, UserLicenses { licenses: vector::empty<License>() });
        };
        let user_licenses = borrow_global_mut<UserLicenses>(buyer_addr);
        vector::push_back(&mut user_licenses.licenses, license);

        // Emit event
        event::emit_event(&mut registry.license_purchased_events, LicensePurchasedEvent {
            record_slug,
            licensee: buyer_addr,
            publisher: publisher_addr,
            tier,
            price_paid: price,
            platform_fee,
            purchased_at: now,
        });

        registry.total_licenses = registry.total_licenses + 1;
        registry.total_volume = registry.total_volume + price;
    }

    // ── View functions ─────────────────────────────────────────────────────────

    #[view]
    public fun get_record(
        platform_addr: address,
        slug: String,
    ): (String, address, u64, u64, u64, bool) acquires Registry {
        assert!(exists<Registry>(platform_addr), E_NOT_INITIALIZED);
        let registry = borrow_global<Registry>(platform_addr);
        let len = vector::length(&registry.records);
        let i = 0;
        while (i < len) {
            let record = vector::borrow(&registry.records, i);
            if (record.slug == slug) {
                return (
                    record.content_hash,
                    record.publisher,
                    record.price_view,
                    record.price_cite,
                    record.price_license,
                    record.is_active,
                )
            };
            i = i + 1;
        };
        abort E_RECORD_NOT_FOUND
    }

    #[view]
    public fun has_license(
        platform_addr: address,
        user_addr: address,
        record_slug: String,
        min_tier: u8,
    ): bool acquires Registry, UserLicenses {
        // Suppress unused warning
        let _ = platform_addr;
        if (!exists<UserLicenses>(user_addr)) return false;
        let user_licenses = borrow_global<UserLicenses>(user_addr);
        let len = vector::length(&user_licenses.licenses);
        let i = 0;
        while (i < len) {
            let license = vector::borrow(&user_licenses.licenses, i);
            if (license.record_slug == record_slug && license.tier >= min_tier) {
                return true
            };
            i = i + 1;
        };
        false
    }

    #[view]
    public fun get_stats(platform_addr: address): (u64, u64, u64) acquires Registry {
        assert!(exists<Registry>(platform_addr), E_NOT_INITIALIZED);
        let registry = borrow_global<Registry>(platform_addr);
        (registry.total_records, registry.total_licenses, registry.total_volume)
    }
}
