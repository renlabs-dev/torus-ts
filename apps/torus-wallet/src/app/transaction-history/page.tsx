"use client";

import { TabLayout } from "../_components/tab-layout";
import { TransactionHistoryList } from "./_components/transaction-history-list";

export default function TransactionHistoryPage() {
  return (
    <TabLayout>
      <div className="container py-6">
        <h1 className="mb-6 text-2xl font-bold">Transaction History</h1>
        <TransactionHistoryList />
      </div>
    </TabLayout>
  );
}