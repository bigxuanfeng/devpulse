"use client";

import { CSSProperties } from "react";

// ===== Skeleton Base =====

function SkeletonBox({
  className = "",
  style = {},
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse bg-bg-hover rounded ${className}`}
      style={style}
    />
  );
}

// ===== Dashboard Skeletons =====

export function KpiSkeleton() {
  return (
    <div className="bg-bg-surface border border-border-default rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SkeletonBox className="w-24 h-4" />
        <SkeletonBox className="w-8 h-8 rounded-md" />
      </div>
      <SkeletonBox className="w-32 h-8" />
      <SkeletonBox className="w-20 h-3" />
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="bg-bg-surface border border-border-default rounded-lg p-5">
      <SkeletonBox className="w-40 h-5 mb-4" />
      <SkeletonBox className="w-full" style={{ height }} />
    </div>
  );
}

export function HealthCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-border-default rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SkeletonBox className="w-32 h-5" />
        <SkeletonBox className="w-16 h-6 rounded-full" />
      </div>
      <div className="space-y-2">
        <SkeletonBox className="w-full h-4" />
        <SkeletonBox className="w-3/4 h-4" />
        <SkeletonBox className="w-1/2 h-4" />
      </div>
    </div>
  );
}

// ===== Diary Skeletons =====

export function DiaryCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-border-default rounded-lg p-5 space-y-3">
      <div className="flex items-start justify-between">
        <SkeletonBox className="w-48 h-5" />
        <SkeletonBox className="w-20 h-4" />
      </div>
      <div className="space-y-2">
        <SkeletonBox className="w-full h-4" />
        <SkeletonBox className="w-full h-4" />
        <SkeletonBox className="w-2/3 h-4" />
      </div>
      <div className="flex gap-2">
        <SkeletonBox className="w-16 h-6 rounded-full" />
        <SkeletonBox className="w-16 h-6 rounded-full" />
        <SkeletonBox className="w-20 h-6 rounded-full" />
      </div>
    </div>
  );
}

// ===== Project Detail Skeletons =====

export function CommitSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-border-default last:border-b-0">
      <SkeletonBox className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="w-3/4 h-4" />
        <div className="flex gap-4">
          <SkeletonBox className="w-24 h-3" />
          <SkeletonBox className="w-20 h-3" />
          <SkeletonBox className="w-16 h-3" />
        </div>
      </div>
    </div>
  );
}

// ===== Project Settings Skeleton =====

export function ProjectListSkeleton() {
  return (
    <div className="divide-y divide-border-default">
      {[1, 2].map((i) => (
        <div key={i} className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <SkeletonBox className="w-24 h-4" />
            <SkeletonBox className="w-48 h-3" />
            <SkeletonBox className="w-12 h-4 rounded-full" />
          </div>
          <SkeletonBox className="w-12 h-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{children}</div>
      ))}
    </>
  );
}
