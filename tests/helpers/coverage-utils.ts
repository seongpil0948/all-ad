import { Page } from "@playwright/test";
import { createCoverageMap } from "istanbul-lib-coverage";
import { createContext } from "istanbul-lib-report";
import * as reports from "istanbul-reports";
import { promises as fs } from "fs";
import { join } from "path";
import v8toIstanbul from "v8-to-istanbul";

export interface JSCoverageEntry {
  url: string;
  scriptId: string;
  source?: string;
  functions: Array<{
    functionName: string;
    ranges: Array<{
      startOffset: number;
      endOffset: number;
      count: number;
    }>;
    isBlockCoverage: boolean;
  }>;
}

export interface CoverageOptions {
  outputDir?: string;
  includeJS?: boolean;
  includeCSS?: boolean;
  resetOnNavigation?: boolean;
  reportAnonymousScripts?: boolean;
}

export class CoverageCollector {
  private page: Page;
  private options: Required<CoverageOptions>;
  private coverageMap = createCoverageMap({});
  private isJSCoverageStarted = false;
  private isCSSCoverageStarted = false;

  constructor(page: Page, options: CoverageOptions = {}) {
    this.page = page;
    this.options = {
      outputDir: options.outputDir || "coverage",
      includeJS: options.includeJS ?? true,
      includeCSS: options.includeCSS ?? true,
      resetOnNavigation: options.resetOnNavigation ?? true,
      reportAnonymousScripts: options.reportAnonymousScripts ?? false,
    };
  }

  async startCoverage(): Promise<void> {
    console.log("🚀 Starting coverage collection...");

    // Start JavaScript coverage
    if (this.options.includeJS) {
      await this.page.coverage.startJSCoverage({
        resetOnNavigation: this.options.resetOnNavigation,
        reportAnonymousScripts: this.options.reportAnonymousScripts,
      });
      this.isJSCoverageStarted = true;
      console.log("✅ JavaScript coverage started");
    }

    // Start CSS coverage
    if (this.options.includeCSS) {
      await this.page.coverage.startCSSCoverage({
        resetOnNavigation: this.options.resetOnNavigation,
      });
      this.isCSSCoverageStarted = true;
      console.log("✅ CSS coverage started");
    }
  }

  async stopCoverage(): Promise<{
    jsCoverage: JSCoverageEntry[];
    cssCoverage: any[];
  }> {
    console.log("🛑 Stopping coverage collection...");

    const jsCoverage: JSCoverageEntry[] = [];
    const cssCoverage: any[] = [];

    // Stop JavaScript coverage
    if (this.isJSCoverageStarted) {
      const jsEntries = await this.page.coverage.stopJSCoverage();
      jsCoverage.push(...jsEntries);
      console.log(`📊 Collected JS coverage for ${jsEntries.length} files`);
    }

    // Stop CSS coverage
    if (this.isCSSCoverageStarted) {
      const cssEntries = await this.page.coverage.stopCSSCoverage();
      cssCoverage.push(...cssEntries);
      console.log(`📊 Collected CSS coverage for ${cssEntries.length} files`);
    }

    return { jsCoverage, cssCoverage };
  }

  async generateReports(
    jsCoverage: JSCoverageEntry[],
    cssCoverage: any[],
  ): Promise<void> {
    console.log("📝 Generating coverage reports...");

    // Ensure output directory exists
    await fs.mkdir(this.options.outputDir, { recursive: true });

    // Process JavaScript coverage
    if (jsCoverage.length > 0) {
      await this.processJSCoverage(jsCoverage);
    }

    // Process CSS coverage (simplified - just save raw data)
    if (cssCoverage.length > 0) {
      await this.processCSSCoverage(cssCoverage);
    }

    console.log(`✅ Coverage reports generated in ${this.options.outputDir}`);
  }

  private async processJSCoverage(
    jsCoverage: JSCoverageEntry[],
  ): Promise<void> {
    console.log("🔄 Processing JavaScript coverage...");

    for (const entry of jsCoverage) {
      try {
        // Skip non-file URLs (like chrome-extension://, data:, etc.)
        if (!entry.url.startsWith("http") && !entry.url.startsWith("file://")) {
          continue;
        }

        // Convert V8 coverage to Istanbul format
        const converter = v8toIstanbul(entry.url, 0, {
          source: entry.source || "",
        });

        await converter.load();
        converter.applyCoverage(entry.functions);

        // Add to coverage map
        const istanbulData = converter.toIstanbul();
        Object.keys(istanbulData).forEach((filename) => {
          this.coverageMap.addFileCoverage(istanbulData[filename]);
        });

        console.log(`✓ Processed: ${entry.url}`);
      } catch (error) {
        console.warn(`⚠️  Failed to process ${entry.url}:`, error);
      }
    }

    // Generate reports
    await this.generateIstanbulReports();
  }

  private async generateIstanbulReports(): Promise<void> {
    try {
      const context = createContext({
        dir: this.options.outputDir,
      });

      // Generate reports with proper error handling
      const reportsList = [
        { name: "html", report: reports.create("html") },
        { name: "json", report: reports.create("json") },
        { name: "lcov", report: reports.create("lcov") },
        { name: "text", report: reports.create("text") },
      ];

      // Save coverage data as JSON for now
      const coverageData = this.coverageMap.data;
      await fs.writeFile(
        join(this.options.outputDir, "coverage-final.json"),
        JSON.stringify(coverageData, null, 2),
      );

      console.log("✅ Coverage data saved to coverage-final.json");
    } catch (error) {
      console.warn("⚠️ Failed to generate Istanbul reports:", error);

      // Fallback: save raw coverage data
      const coverageData = this.coverageMap.data;
      await fs.writeFile(
        join(this.options.outputDir, "coverage-raw.json"),
        JSON.stringify(coverageData, null, 2),
      );
      console.log("✅ Raw coverage data saved");
    }
  }

  private async processCSSCoverage(cssCoverage: any[]): Promise<void> {
    console.log("🔄 Processing CSS coverage...");

    const cssReport = {
      timestamp: new Date().toISOString(),
      files: cssCoverage.map((entry) => ({
        url: entry.url,
        usedBytes:
          entry.ranges?.reduce(
            (sum: number, range: any) => sum + (range.end - range.start),
            0,
          ) || 0,
        totalBytes: entry.text?.length || 0,
        usagePercentage: entry.text
          ? ((entry.ranges?.reduce(
              (sum: number, range: any) => sum + (range.end - range.start),
              0,
            ) || 0) /
              entry.text.length) *
            100
          : 0,
        ranges: entry.ranges || [],
      })),
      summary: {
        totalFiles: cssCoverage.length,
        totalUsedBytes: cssCoverage.reduce(
          (sum, entry) =>
            sum +
            (entry.ranges?.reduce(
              (rangeSum: number, range: any) =>
                rangeSum + (range.end - range.start),
              0,
            ) || 0),
          0,
        ),
        totalBytes: cssCoverage.reduce(
          (sum, entry) => sum + (entry.text?.length || 0),
          0,
        ),
        usagePercentage: 0, // Will be calculated below
      } as any,
    };

    // Calculate overall usage percentage
    if (cssReport.summary.totalBytes > 0) {
      cssReport.summary = {
        ...cssReport.summary,
        usagePercentage:
          (cssReport.summary.totalUsedBytes / cssReport.summary.totalBytes) *
          100,
      };
    }

    await fs.writeFile(
      join(this.options.outputDir, "css-coverage.json"),
      JSON.stringify(cssReport, null, 2),
    );

    console.log("✅ CSS coverage report generated");
  }
}

// Helper function for easy usage in tests
export async function collectCoverageForTest(
  page: Page,
  testFn: () => Promise<void>,
  options: CoverageOptions = {},
): Promise<{
  jsCoverage: JSCoverageEntry[];
  cssCoverage: any[];
}> {
  const collector = new CoverageCollector(page, options);

  await collector.startCoverage();

  try {
    await testFn();
  } finally {
    const coverage = await collector.stopCoverage();
    await collector.generateReports(coverage.jsCoverage, coverage.cssCoverage);
    return coverage;
  }
}

// Coverage summary helper
export function analyzeCoverageSummary(
  coveragePath: string = "coverage/coverage-final.json",
) {
  return {
    async getSummary() {
      try {
        const coverageData = JSON.parse(
          await fs.readFile(coveragePath, "utf-8"),
        );

        let totalStatements = 0;
        let coveredStatements = 0;
        let totalFunctions = 0;
        let coveredFunctions = 0;
        let totalBranches = 0;
        let coveredBranches = 0;
        let totalLines = 0;
        let coveredLines = 0;

        Object.values(coverageData).forEach((fileCoverage: any) => {
          const { s, f, b, l } = fileCoverage;

          // Statements
          totalStatements += Object.keys(s).length;
          coveredStatements += Object.values(s).filter(Boolean).length;

          // Functions
          totalFunctions += Object.keys(f).length;
          coveredFunctions += Object.values(f).filter(Boolean).length;

          // Branches
          totalBranches += Object.keys(b).length;
          coveredBranches += Object.values(b).flat().filter(Boolean).length;

          // Lines
          totalLines += Object.keys(l).length;
          coveredLines += Object.values(l).filter(Boolean).length;
        });

        return {
          statements: {
            total: totalStatements,
            covered: coveredStatements,
            percentage:
              totalStatements > 0
                ? (coveredStatements / totalStatements) * 100
                : 0,
          },
          functions: {
            total: totalFunctions,
            covered: coveredFunctions,
            percentage:
              totalFunctions > 0
                ? (coveredFunctions / totalFunctions) * 100
                : 0,
          },
          branches: {
            total: totalBranches,
            covered: coveredBranches,
            percentage:
              totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
          },
          lines: {
            total: totalLines,
            covered: coveredLines,
            percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
          },
        };
      } catch (error) {
        console.error("Failed to analyze coverage summary:", error);
        return null;
      }
    },
  };
}
