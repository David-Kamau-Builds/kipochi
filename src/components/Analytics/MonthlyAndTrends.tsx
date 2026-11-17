import React, { useState } from 'react';
import {
  Paper,
  SimpleGrid,
  Group,
  Text,
  Badge,
  Table,
  Stack,
  ThemeIcon,
  SegmentedControl,
  Box,
  Progress,
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconTrendingDown,
  IconTrendingUp,
  IconSunHigh,
  IconFlame,
  IconChartLine,
} from '@tabler/icons-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { DayInsight, MonthlyMetric } from '../../types/transaction';

interface MonthlyAndTrendsProps {
  monthlyMetrics: MonthlyMetric[];
  dayInsights: DayInsight;
}

export const MonthlyAndTrends: React.FC<MonthlyAndTrendsProps> = ({ monthlyMetrics, dayInsights }) => {
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative'>('daily');
  const { worstDay, bestDay, zeroSpendDaysCount, busiestDayOfWeek, dailyTrend, dayOfWeekBreakdown } = dayInsights;

  // Find max spending among days of week for relative bar scale
  const maxDayOfWeekSpend = Math.max(...dayOfWeekBreakdown.map((d) => d.totalSpent), 1);

  return (
    <Stack gap="lg">
      {/* 1. Best & Worst Days Highlight Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        {/* Worst Day (Peak Spend) */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Worst Day (Peak Spend)
            </Text>
            <ThemeIcon color="red" variant="light" size="md">
              <IconTrendingDown size={18} />
            </ThemeIcon>
          </Group>

          {worstDay ? (
            <>
              <Text fw={800} size="xl" mt="xs" c="red.7">
                KES {worstDay.totalSpent.toLocaleString('en-KE')}
              </Text>
              <Text size="xs" fw={600} mt={2}>
                {worstDay.dateFormatted}
              </Text>
              <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
                {worstDay.txCount} txs • Biggest: {worstDay.biggestTxCounterparty} (KES{' '}
                {worstDay.biggestTxAmount.toLocaleString('en-KE')})
              </Text>
            </>
          ) : (
            <Text size="sm" c="dimmed" mt="xs">No expense data</Text>
          )}
        </Paper>

        {/* Best Day (Highest Net Gain) */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Best Day (Highest Net Gain)
            </Text>
            <ThemeIcon color="teal" variant="light" size="md">
              <IconTrendingUp size={18} />
            </ThemeIcon>
          </Group>

          {bestDay ? (
            <>
              <Text fw={800} size="xl" mt="xs" c="teal.7">
                +KES {bestDay.netGain.toLocaleString('en-KE')}
              </Text>
              <Text size="xs" fw={600} mt={2}>
                {bestDay.dateFormatted}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Inflow: KES {bestDay.totalIn.toLocaleString('en-KE')} • Outflow: KES {bestDay.totalOut.toLocaleString('en-KE')}
              </Text>
            </>
          ) : (
            <Text size="sm" c="dimmed" mt="xs">No inflow data</Text>
          )}
        </Paper>

        {/* Zero-Spend Frugal Days */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Zero-Spend Frugal Days
            </Text>
            <ThemeIcon color="green" variant="light" size="md">
              <IconSunHigh size={18} />
            </ThemeIcon>
          </Group>

          <Text fw={800} size="xl" mt="xs" c="green.7">
            {zeroSpendDaysCount} Days
          </Text>
          <Text size="xs" fw={600} mt={2}>
            100% Cash Retained
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Days where you spent KES 0.00 on M-Pesa. More zero-spend days directly accelerate savings.
          </Text>
        </Paper>

        {/* Busiest Spending Day */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Busiest Spending Day
            </Text>
            <ThemeIcon color="orange" variant="light" size="md">
              <IconFlame size={18} />
            </ThemeIcon>
          </Group>

          <Text fw={800} size="xl" mt="xs" c="orange.7">
            {busiestDayOfWeek.dayName}s
          </Text>
          <Text size="xs" fw={600} mt={2}>
            {busiestDayOfWeek.percentage.toFixed(1)}% of all spending
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Total: KES {busiestDayOfWeek.totalSpent.toLocaleString('en-KE')} spent on {busiestDayOfWeek.dayName}s.
          </Text>
        </Paper>
      </SimpleGrid>

      {/* 2. Performance Line Graph */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center" mb="md" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" size="md">
              <IconChartLine size={18} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm">
                Cash Flow Performance & Trajectory Over Time
              </Text>
              <Text size="xs" c="dimmed">
                Chronological timeline tracking daily liquidity and cumulative wealth retention
              </Text>
            </div>
          </Group>

          <SegmentedControl
            size="xs"
            value={chartMode}
            onChange={(val: any) => setChartMode(val)}
            data={[
              { label: 'Daily Inflow vs Outflow', value: 'daily' },
              { label: 'Cumulative Net Savings Curve', value: 'cumulative' },
            ]}
          />
        </Group>

        <Box h={320} w="100%">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'daily' ? (
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#12b886" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#12b886" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fa5252" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#fa5252" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dateFormatted" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip
                  formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, '']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="in"
                  name="Money In (KES)"
                  stroke="#12b886"
                  fillOpacity={1}
                  fill="url(#colorIn)"
                />
                <Area
                  type="monotone"
                  dataKey="out"
                  name="Money Out (KES)"
                  stroke="#fa5252"
                  fillOpacity={1}
                  fill="url(#colorOut)"
                />
              </AreaChart>
            ) : (
              <LineChart data={dailyTrend} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dateFormatted" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip
                  formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, 'Cumulative Net Savings']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulativeSavings"
                  name="Cumulative Net Savings (KES)"
                  stroke="#228be6"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* 3. Per-Month Analytics Table */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center" mb="sm">
          <Group gap="xs">
            <ThemeIcon color="teal" variant="light" size="md">
              <IconCalendarEvent size={18} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm">
                Month-by-Month Financial Performance
              </Text>
              <Text size="xs" c="dimmed">
                Compare cash inflows, expenditures, and net savings rate across distinct calendar months
              </Text>
            </div>
          </Group>
          <Badge variant="light" color="teal">
            {monthlyMetrics.length} Months Analyzed
          </Badge>
        </Group>

        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Month</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Total In (KES)</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Total Out (KES)</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Net Savings (KES)</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Savings Rate</Table.Th>
              <Table.Th>Top Spend of the Month</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Tx Count</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {monthlyMetrics.map((m) => (
              <Table.Tr key={m.monthKey}>
                <Table.Td>
                  <Text fw={700} size="sm">
                    {m.monthLabel}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Avg KES {Math.round(m.avgDailySpend).toLocaleString()}/day
                  </Text>
                </Table.Td>

                <Table.Td style={{ textAlign: 'right' }}>
                  <Text fw={600} size="sm" c="teal.7">
                    +KES {m.totalIn.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </Text>
                </Table.Td>

                <Table.Td style={{ textAlign: 'right' }}>
                  <Text fw={600} size="sm" c="red.7">
                    -KES {m.totalOut.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </Text>
                </Table.Td>

                <Table.Td style={{ textAlign: 'right' }}>
                  <Text fw={700} size="sm" c={m.netSavings >= 0 ? 'teal.7' : 'orange.7'}>
                    {m.netSavings >= 0 ? '+' : ''}
                    KES {m.netSavings.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </Text>
                </Table.Td>

                <Table.Td style={{ textAlign: 'center' }}>
                  <Badge color={m.savingsRate >= 15 ? 'teal' : m.savingsRate > 0 ? 'yellow' : 'red'}>
                    {m.savingsRate.toFixed(1)}%
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Text size="xs" fw={600}>
                    {m.topSpend.counterparty}
                  </Text>
                  <Text size="xs" c="dimmed">
                    KES {m.topSpend.amount.toLocaleString('en-KE')}
                  </Text>
                </Table.Td>

                <Table.Td style={{ textAlign: 'center' }}>
                  <Badge size="xs" variant="outline" color="gray">
                    {m.txCount}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* 4. Day of the Week Distribution */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center" mb="sm">
          <div>
            <Text fw={700} size="sm">
              Spending Distribution by Day of the Week
            </Text>
            <Text size="xs" c="dimmed">
              Identify regular weekly patterns to curb cyclical overspending
            </Text>
          </div>
          <Badge variant="outline" color="orange">
            Weekly Rhythm
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 7 }} spacing="xs" mt="md">
          {dayOfWeekBreakdown.map((d) => {
            const isBusiest = d.dayName === busiestDayOfWeek.dayName;
            const percent = (d.totalSpent / maxDayOfWeekSpend) * 100;

            return (
              <Paper key={d.dayName} withBorder p="xs" radius="sm" bg={isBusiest ? 'var(--mantine-color-orange-0)' : undefined}>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" fw={700}>
                    {d.dayName.substring(0, 3)}
                  </Text>
                  {isBusiest && (
                    <Badge size="xs" color="orange" variant="filled">
                      Peak
                    </Badge>
                  )}
                </Group>

                <Text fw={700} size="sm" c={isBusiest ? 'orange.8' : 'dimmed'}>
                  KES {d.totalSpent.toLocaleString('en-KE')}
                </Text>
                <Text size="xs" c="dimmed" mb="xs">
                  {d.count} payments
                </Text>

                <Progress value={percent} color={isBusiest ? 'orange' : 'blue'} size="xs" radius="xl" />
              </Paper>
            );
          })}
        </SimpleGrid>
      </Paper>
    </Stack>
  );
};
