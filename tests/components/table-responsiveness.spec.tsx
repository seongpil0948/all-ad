import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { DataTable } from "@/components/common/table/DataTable";

type Row = { id: string; name: string; budget: string; platform: string };

test.describe("Table responsiveness @component", () => {
  test("applies hideBelow classes on headers and cells", async ({ mount }) => {
    const columns = [
      { key: "name", label: "Name" },
      { key: "platform", label: "Platform", hideBelow: "md" as const },
      { key: "budget", label: "Budget", hideBelow: "lg" as const },
    ];
    const data: Row[] = [
      { id: "1", name: "Campaign A", platform: "google", budget: "₩1,000" },
    ];

    const component = await mount(
      <DataTable<Row>
        aria-label="Table"
        columns={columns}
        data={data}
        renderCell={(item, key) => item[key as keyof Row] as string}
      />,
    );

    // Header classes
    const platformHeader = component.locator(
      '[data-testid="table-header-platform"]',
    );
    const budgetHeader = component.locator(
      '[data-testid="table-header-budget"]',
    );
    await expect(platformHeader).toHaveClass(/hidden md:table-cell/);
    await expect(budgetHeader).toHaveClass(/hidden lg:table-cell/);

    // Body cell classes
    const platformCell = component.locator(
      '[data-testid="table-cell-1-platform"]',
    );
    const budgetCell = component.locator('[data-testid="table-cell-1-budget"]');
    await expect(platformCell).toHaveClass(/hidden md:table-cell/);
    await expect(budgetCell).toHaveClass(/hidden lg:table-cell/);
  });
});
