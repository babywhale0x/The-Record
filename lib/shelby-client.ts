/**
 * Copyright (C) 2026 [YOUR FULL LEGAL NAME OR COMPANY NAME]
 * Licensed under the Business Source License 1.1 — see LICENSE for terms.
 *
 * lib/shelby-client.ts
 *
 * Browser-safe client for The Record's Shelby API routes.
 * Import this in 'use client' components — it never touches env vars or private keys.
 *
 * Usage:
 *   import { shelbyApi } from '@/lib/shelby-client'
 *
 *   // In ArticleEditor publish flow:
 *   const receipt = await shelbyApi.publish(articlePayload, files, token, onStage)
 *
 *   // In ArticlePage verify button:
 *   const result = await shelbyApi.verify({ blobName, contentHash, aptosTxHash })
 */

import type { UploadReceipt, VerificationResult, ArticlePayload } from './shelby'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublishResult {
  ok: boolean
  article: UploadReceipt
  documents: Array<UploadReceipt & { originalName: string; error?: string }>
}

export interface BalanceResult {
  apt: string
  shelbyUsd: string
  address: string
}

export type PublishStage =
  | 'idle'
  | 'uploading-article'
  | 'uploading-documents'
  | 'complete'
  | 'error'

// ─── Client ───────────────────────────────────────────────────────────────────

async function publish(
  article: ArticlePayload,
  documents: File[],
  bearerToken: string,
  onStage?: (stage: PublishStage) => void
): Promise<PublishResult> {
  onStage?.('uploading-article')

  const form = new FormData()
  form.append('article', JSON.stringify(article))

  for (const file of documents) {
    form.append('documents', file)
  }

  if (documents.length > 0) {
    onStage?.('uploading-documents')
  }

  const res = await fetch('/api/publish', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bearerToken}` },
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    onStage?.('error')
    throw new Error(err.error ?? 'Publish failed')
  }

  const result: PublishResult = await res.json()
  onStage?.('complete')
  return result
}

async function verify(params: {
  blobName: string
  contentHash: string
  aptosTxHash: string
}): Promise<VerificationResult> {
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error ?? 'Verification failed')
  }

  return res.json() as Promise<VerificationResult>
}

async function getBalance(bearerToken: string): Promise<BalanceResult> {
  const res = await fetch('/api/balance', {
    headers: { Authorization: `Bearer ${bearerToken}` },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error ?? 'Failed to fetch balance')
  }

  return res.json() as Promise<BalanceResult>
}

/**
 * Estimate upload cost without hitting the server.
 * Mirrors the logic in lib/shelby.ts estimateUploadCost.
 */
function estimateCost(bytes: number, ttlDays = 365): string {
  const gb = bytes / 1024 ** 3
  const months = ttlDays / 30
  const cost = gb * 0.01 * months
  if (cost < 0.000001) return '< $0.000001'
  return `$${cost.toFixed(6)}`
}

export const shelbyApi = {
  publish,
  verify,
  getBalance,
  estimateCost,
} as const
