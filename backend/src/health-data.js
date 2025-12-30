/**
 * Health Data Store
 *
 * Handles ingestion and retrieval of HealthKit data synced from iOS devices.
 * Stores data as JSON files organized by date, making it easy for Claude Code
 * to read and analyze health trends.
 */

import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
  ),
  transports: [new transports.Console()]
});

// Directory for health data storage
const HEALTH_DATA_DIR = process.env.HEALTH_DATA_DIR || '/home/alfonso/hustle/health/data';

/**
 * Manages health data storage and retrieval
 */
export class HealthDataStore {
  constructor() {
    this.dataDir = HEALTH_DATA_DIR;
    this.ensureDataDirectory();
  }

  /**
   * Ensure the data directory exists
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      logger.info(`Created health data directory: ${this.dataDir}`);
    }
  }

  /**
   * Get the file path for a specific date
   */
  getFilePath(date) {
    const dateStr = this.normalizeDate(date);
    return path.join(this.dataDir, `${dateStr}.json`);
  }

  /**
   * Normalize date to YYYY-MM-DD format
   */
  normalizeDate(date) {
    if (typeof date === 'string') {
      // Handle ISO strings
      return date.split('T')[0];
    }
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Ingest health data from iOS app
   *
   * Expected format:
   * {
   *   date: "2024-12-30",
   *   metrics: {
   *     steps: 8432,
   *     heartRateAvg: 72,
   *     heartRateMin: 58,
   *     heartRateMax: 142,
   *     sleepHours: 7.2,
   *     sleepDeepMinutes: 85,
   *     sleepRemMinutes: 110,
   *     sleepLightMinutes: 220,
   *     bloodPressure: { systolic: 118, diastolic: 78 },
   *     bloodGlucose: 95,
   *     oxygenSaturation: 98,
   *     bodyMass: 185.5,
   *     activeCalories: 420,
   *     distanceMiles: 3.2,
   *     flightsClimbed: 12
   *   }
   * }
   */
  ingest(data) {
    const dateStr = this.normalizeDate(data.date || new Date());
    const filepath = this.getFilePath(dateStr);

    // Merge with existing data for that day
    let existing = {};
    if (fs.existsSync(filepath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      } catch (err) {
        logger.warn(`Error reading existing health data for ${dateStr}: ${err.message}`);
      }
    }

    // Merge metrics (new values overwrite old ones)
    const merged = {
      date: dateStr,
      ...existing,
      ...data.metrics,
      lastUpdated: new Date().toISOString(),
      syncCount: (existing.syncCount || 0) + 1
    };

    // Write back to file
    fs.writeFileSync(filepath, JSON.stringify(merged, null, 2));
    logger.info(`Ingested health data for ${dateStr}: ${Object.keys(data.metrics || {}).length} metrics`);

    return merged;
  }

  /**
   * Get health data for a specific date
   */
  getForDate(date) {
    const filepath = this.getFilePath(date);

    if (!fs.existsSync(filepath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (err) {
      logger.error(`Error reading health data for ${date}: ${err.message}`);
      return null;
    }
  }

  /**
   * Get health data for a date range
   */
  getRange(startDate, endDate) {
    const results = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Iterate through each day in the range
    const current = new Date(start);
    while (current <= end) {
      const data = this.getForDate(current);
      if (data) {
        results.push(data);
      }
      current.setDate(current.getDate() + 1);
    }

    return results;
  }

  /**
   * Get the last N days of health data
   */
  getLastNDays(days = 7) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    return this.getRange(start, end);
  }

  /**
   * Get summary statistics for a date range
   */
  getSummary(startDate, endDate) {
    const data = this.getRange(startDate, endDate);

    if (data.length === 0) {
      return null;
    }

    const summary = {
      dateRange: {
        start: startDate,
        end: endDate,
        daysWithData: data.length
      },
      steps: this.calculateStats(data, 'steps'),
      heartRate: this.calculateStats(data, 'heartRateAvg'),
      sleep: this.calculateStats(data, 'sleepHours'),
      activeCalories: this.calculateStats(data, 'activeCalories'),
      weight: this.getLatestValue(data, 'bodyMass')
    };

    return summary;
  }

  /**
   * Calculate statistics for a metric
   */
  calculateStats(data, metric) {
    const values = data
      .map(d => d[metric])
      .filter(v => v !== undefined && v !== null && !isNaN(v));

    if (values.length === 0) {
      return null;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);

    return {
      avg: Math.round(avg * 10) / 10,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: values.length
    };
  }

  /**
   * Get the latest non-null value for a metric
   */
  getLatestValue(data, metric) {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][metric] !== undefined && data[i][metric] !== null) {
        return {
          value: data[i][metric],
          date: data[i].date
        };
      }
    }
    return null;
  }

  /**
   * Log a single metric (for quick logging from the app)
   */
  logMetric(metric, value, date = null) {
    const dateStr = this.normalizeDate(date || new Date());
    return this.ingest({
      date: dateStr,
      metrics: {
        [metric]: value
      }
    });
  }

  /**
   * Get list of all dates with data
   */
  listDates() {
    try {
      const files = fs.readdirSync(this.dataDir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
        .sort()
        .reverse();
      return files;
    } catch (err) {
      logger.error(`Error listing health data dates: ${err.message}`);
      return [];
    }
  }

  /**
   * Generate a markdown summary for Claude to read
   */
  generateMarkdownSummary(days = 7) {
    const data = this.getLastNDays(days);

    if (data.length === 0) {
      return '# Health Data Summary\n\nNo health data available for the selected period.';
    }

    let md = `# Health Data Summary (Last ${days} Days)\n\n`;
    md += `*Generated: ${new Date().toISOString()}*\n\n`;

    // Daily breakdown
    md += '## Daily Log\n\n';
    md += '| Date | Steps | Sleep (hrs) | Avg HR | Active Cal |\n';
    md += '|------|-------|-------------|--------|------------|\n';

    for (const day of data.reverse()) {
      md += `| ${day.date} | ${day.steps || '-'} | ${day.sleepHours?.toFixed(1) || '-'} | ${day.heartRateAvg || '-'} | ${day.activeCalories || '-'} |\n`;
    }

    // Summary stats
    const summary = this.getSummary(
      data[0]?.date || new Date().toISOString(),
      data[data.length - 1]?.date || new Date().toISOString()
    );

    if (summary) {
      md += '\n## Summary Statistics\n\n';

      if (summary.steps) {
        md += `- **Steps**: Avg ${summary.steps.avg.toLocaleString()}, Range ${summary.steps.min.toLocaleString()}-${summary.steps.max.toLocaleString()}\n`;
      }
      if (summary.sleep) {
        md += `- **Sleep**: Avg ${summary.sleep.avg} hours, Range ${summary.sleep.min}-${summary.sleep.max} hours\n`;
      }
      if (summary.heartRate) {
        md += `- **Heart Rate**: Avg ${summary.heartRate.avg} bpm, Range ${summary.heartRate.min}-${summary.heartRate.max} bpm\n`;
      }
      if (summary.weight) {
        md += `- **Weight**: ${summary.weight.value} lbs (as of ${summary.weight.date})\n`;
      }
    }

    return md;
  }
}

export default HealthDataStore;
