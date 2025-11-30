import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  Mdi,
  enablePerformanceMonitoring,
  disablePerformanceMonitoring,
  getPerformanceReport,
  printPerformanceReport,
  PerformanceMonitor,
} from 'rn-iconify';
import { Section } from '../../components/common';
import type { IconLoadEvent, PerformanceReport } from 'rn-iconify';

export default function PerformanceScreen() {
  const isDark = useColorScheme() === 'dark';
  const [isEnabled, setIsEnabled] = useState(false);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [events, setEvents] = useState<IconLoadEvent[]>([]);

  const refreshReport = useCallback(() => {
    setReport(getPerformanceReport());
  }, []);

  useEffect(() => {
    // Enable monitoring on mount
    enablePerformanceMonitoring();
    setIsEnabled(true);
    refreshReport();

    // Subscribe to events
    const unsubscribe = PerformanceMonitor.subscribe((event) => {
      setEvents((prev) => [event, ...prev].slice(0, 20));
      refreshReport();
    });

    return () => {
      unsubscribe();
    };
  }, [refreshReport]);

  const toggleMonitoring = () => {
    if (isEnabled) {
      disablePerformanceMonitoring();
    } else {
      enablePerformanceMonitoring();
    }
    setIsEnabled(!isEnabled);
  };

  const handleReset = () => {
    PerformanceMonitor.reset();
    setEvents([]);
    refreshReport();
  };

  const handlePrint = () => {
    printPerformanceReport();
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      {/* Controls */}
      <Section title="Monitoring Controls">
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              isEnabled ? styles.disableButton : styles.enableButton,
            ]}
            onPress={toggleMonitoring}
          >
            <Text style={styles.controlButtonText}>
              {isEnabled ? 'Disable' : 'Enable'} Monitoring
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton]}
            onPress={handleReset}
          >
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.printButton]}
            onPress={handlePrint}
          >
            <Text style={styles.controlButtonText}>Print</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshReport}
        >
          <Mdi name="refresh" size={20} color="#FFF" />
          <Text style={styles.refreshButtonText}>Refresh Report</Text>
        </TouchableOpacity>
      </Section>

      {report && (
        <>
          {/* Summary */}
          <Section title="Summary">
            <View style={styles.metricsGrid}>
              <MetricCard
                label="Total Loads"
                value={report.summary.totalLoads.toString()}
                isDark={isDark}
              />
              <MetricCard
                label="Avg Load Time"
                value={`${report.summary.avgLoadTime.toFixed(1)}ms`}
                isDark={isDark}
              />
              <MetricCard
                label="Cache Hit Rate"
                value={`${(report.cacheStats.hitRate * 100).toFixed(1)}%`}
                isDark={isDark}
                highlight={report.cacheStats.hitRate > 0.9}
              />
              <MetricCard
                label="Errors"
                value={report.summary.totalErrors.toString()}
                isDark={isDark}
                warning={report.summary.totalErrors > 0}
              />
            </View>
          </Section>

          {/* Cache Statistics */}
          <Section title="Cache Statistics">
            <View style={[styles.cacheStats, isDark && styles.cacheStatsDark]}>
              <CacheStatRow
                label="Memory Hits"
                value={report.cacheStats.memoryHits}
                total={report.cacheStats.totalRequests}
                isDark={isDark}
              />
              <CacheStatRow
                label="Bundled Hits"
                value={report.cacheStats.bundledHits}
                total={report.cacheStats.totalRequests}
                isDark={isDark}
              />
              <CacheStatRow
                label="Disk Hits"
                value={report.cacheStats.diskHits}
                total={report.cacheStats.totalRequests}
                isDark={isDark}
              />
              <CacheStatRow
                label="Network Fetches"
                value={report.cacheStats.networkFetches}
                total={report.cacheStats.totalRequests}
                isDark={isDark}
                warning
              />
              <CacheStatRow
                label="Errors"
                value={report.cacheStats.errors}
                total={report.cacheStats.totalRequests}
                isDark={isDark}
                warning
              />
            </View>
          </Section>

          {/* Load Times by Type */}
          <Section title="Load Times by Source">
            <View style={[styles.loadTimes, isDark && styles.loadTimesDark]}>
              <LoadTimeRow
                label="Memory"
                time={report.loadTimesByType.memory}
                isDark={isDark}
                color="#4CAF50"
              />
              <LoadTimeRow
                label="Bundled"
                time={report.loadTimesByType.bundled}
                isDark={isDark}
                color="#2196F3"
              />
              <LoadTimeRow
                label="Disk"
                time={report.loadTimesByType.disk}
                isDark={isDark}
                color="#FF9800"
              />
              <LoadTimeRow
                label="Network"
                time={report.loadTimesByType.network}
                isDark={isDark}
                color="#F44336"
              />
            </View>
          </Section>

          {/* Slowest Icons */}
          {report.slowestIcons.length > 0 && (
            <Section title="Slowest Icons">
              <View style={[styles.list, isDark && styles.listDark]}>
                {report.slowestIcons.slice(0, 5).map((icon, index) => (
                  <View key={icon.iconName} style={styles.listItem}>
                    <Text style={[styles.listRank, isDark && styles.listRankDark]}>
                      #{index + 1}
                    </Text>
                    <Text style={[styles.listName, isDark && styles.listNameDark]}>
                      {icon.iconName}
                    </Text>
                    <Text style={[styles.listValue, isDark && styles.listValueDark]}>
                      {icon.avgDuration.toFixed(1)}ms
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* Most Used Icons */}
          {report.mostUsedIcons.length > 0 && (
            <Section title="Most Used Icons">
              <View style={[styles.list, isDark && styles.listDark]}>
                {report.mostUsedIcons.slice(0, 5).map((icon, index) => (
                  <View key={icon.iconName} style={styles.listItem}>
                    <Text style={[styles.listRank, isDark && styles.listRankDark]}>
                      #{index + 1}
                    </Text>
                    <Text style={[styles.listName, isDark && styles.listNameDark]}>
                      {icon.iconName}
                    </Text>
                    <Text style={[styles.listValue, isDark && styles.listValueDark]}>
                      {icon.count}x
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          )}
        </>
      )}

      {/* Recent Events */}
      <Section title="Recent Events" description={`Last ${events.length} events`}>
        {events.length === 0 ? (
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            No events yet. Use some icons to see load events.
          </Text>
        ) : (
          <View style={[styles.eventsList, isDark && styles.eventsListDark]}>
            {events.slice(0, 10).map((event, index) => (
              <View key={`${event.iconName}-${event.timestamp}-${index}`} style={styles.eventItem}>
                <View
                  style={[
                    styles.eventDot,
                    { backgroundColor: event.type === 'error' ? '#F44336' : '#4CAF50' },
                  ]}
                />
                <Text style={[styles.eventName, isDark && styles.eventNameDark]}>
                  {event.iconName}
                </Text>
                <Text style={[styles.eventDuration, isDark && styles.eventDurationDark]}>
                  {event.duration.toFixed(1)}ms
                </Text>
                <Text style={[styles.eventSource, isDark && styles.eventSourceDark]}>
                  {event.type}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Section>

      {/* Code Example */}
      <Section title="Code Example">
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`import {
  enablePerformanceMonitoring,
  getPerformanceReport,
  PerformanceMonitor,
} from 'rn-iconify';

// Enable monitoring
enablePerformanceMonitoring();

// Get report
const report = getPerformanceReport();
console.log('Cache hit rate:', report.summary.cacheHitRate);

// Subscribe to events
const unsubscribe = PerformanceMonitor.subscribe((event) => {
  if (event.type === 'error') {
    console.error('Icon load failed:', event.iconName);
  }
});`}
          </Text>
        </View>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  isDark,
  highlight,
  warning,
}: {
  label: string;
  value: string;
  isDark: boolean;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <View style={[styles.metricCard, isDark && styles.metricCardDark]}>
      <Text
        style={[
          styles.metricValue,
          isDark && styles.metricValueDark,
          highlight && styles.metricHighlight,
          warning && styles.metricWarning,
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>{label}</Text>
    </View>
  );
}

function CacheStatRow({
  label,
  value,
  total,
  isDark,
  warning,
}: {
  label: string;
  value: number;
  total: number;
  isDark: boolean;
  warning?: boolean;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>{label}</Text>
      <View style={styles.statBar}>
        <View
          style={[
            styles.statBarFill,
            { width: `${percentage}%` },
            warning && styles.statBarWarning,
          ]}
        />
      </View>
      <Text style={[styles.statValue, isDark && styles.statValueDark]}>
        {value} ({percentage.toFixed(0)}%)
      </Text>
    </View>
  );
}

function LoadTimeRow({
  label,
  time,
  isDark,
  color,
}: {
  label: string;
  time: number;
  isDark: boolean;
  color: string;
}) {
  return (
    <View style={styles.loadTimeRow}>
      <View style={[styles.loadTimeDot, { backgroundColor: color }]} />
      <Text style={[styles.loadTimeLabel, isDark && styles.loadTimeLabelDark]}>{label}</Text>
      <Text style={[styles.loadTimeValue, isDark && styles.loadTimeValueDark]}>
        {time > 0 ? `${time.toFixed(2)}ms` : 'N/A'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  content: {
    padding: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  enableButton: {
    backgroundColor: '#4CAF50',
  },
  disableButton: {
    backgroundColor: '#F44336',
  },
  resetButton: {
    backgroundColor: '#FF9800',
  },
  printButton: {
    backgroundColor: '#2196F3',
  },
  controlButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#607D8B',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricCardDark: {
    backgroundColor: '#2A2A2A',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricValueDark: {
    color: '#FFF',
  },
  metricHighlight: {
    color: '#4CAF50',
  },
  metricWarning: {
    color: '#F44336',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricLabelDark: {
    color: '#AAA',
  },
  cacheStats: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  cacheStatsDark: {
    backgroundColor: '#2A2A2A',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    width: 100,
    fontSize: 14,
    color: '#333',
  },
  statLabelDark: {
    color: '#FFF',
  },
  statBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  statBarWarning: {
    backgroundColor: '#FF9800',
  },
  statValue: {
    width: 80,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  statValueDark: {
    color: '#AAA',
  },
  loadTimes: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  loadTimesDark: {
    backgroundColor: '#2A2A2A',
  },
  loadTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadTimeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  loadTimeLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  loadTimeLabelDark: {
    color: '#FFF',
  },
  loadTimeValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#666',
  },
  loadTimeValueDark: {
    color: '#AAA',
  },
  list: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  listDark: {
    backgroundColor: '#2A2A2A',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  listRank: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  listRankDark: {
    color: '#AAA',
  },
  listName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  listNameDark: {
    color: '#FFF',
  },
  listValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#666',
  },
  listValueDark: {
    color: '#AAA',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 24,
  },
  emptyTextDark: {
    color: '#AAA',
  },
  eventsList: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventsListDark: {
    backgroundColor: '#2A2A2A',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  eventName: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  eventNameDark: {
    color: '#FFF',
  },
  eventDuration: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    marginRight: 8,
  },
  eventDurationDark: {
    color: '#AAA',
  },
  eventSource: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
  },
  eventSourceDark: {
    color: '#666',
  },
  codeBlock: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#D4D4D4',
  },
});
