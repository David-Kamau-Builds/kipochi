import React from 'react';
import { Paper, SimpleGrid, Group, Text, ThemeIcon, Progress, Stack, Table, Badge } from '@mantine/core';
import { IconCalendarStats, IconBuildingStore } from '@tabler/icons-react';
import { FinancialHealthMetrics } from '../../types/transaction';

interface BehavioralProps {
  metrics: FinancialHealthMetrics;
}

export const Behavioral: React.FC<BehavioralProps> = ({ metrics }) => {
  return (
    <Stack gap="md">
      {/* Weekend vs Weekday Overview */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="sm">
            <Group gap="xs">
              <ThemeIcon color="orange" variant="light" size="md">
                <IconCalendarStats size={18} />
              </ThemeIcon>
              <div>
                <Text fw={700} size="sm">
                  Weekend vs Weekday Spending Behavior
                </Text>
                <Text size="xs" c="dimmed">
                  Tracks lifestyle inflation from Friday 5 PM through Sunday night
                </Text>
              </div>
            </Group>
            <Badge color={metrics.weekendSpendPercentage > 40 ? 'orange' : 'teal'}>
              {metrics.weekendSpendPercentage.toFixed(1)}% Weekend Spend
            </Badge>
          </Group>

          <Stack gap="xs" mt="md">
            <div>
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={600}>
                  Weekend (Fri Eve - Sun)
                </Text>
                <Text size="xs" fw={700} c="orange.7">
                  KES {metrics.weekendSpendTotal.toLocaleString('en-KE')} ({metrics.weekendSpendPercentage.toFixed(1)}%)
                </Text>
              </Group>
              <Progress value={metrics.weekendSpendPercentage} color="orange" radius="xl" size="md" />
            </div>

            <div>
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={600}>
                  Weekday (Mon - Fri Afternoon)
                </Text>
                <Text size="xs" fw={700} c="blue.7">
                  KES {metrics.weekdaySpendTotal.toLocaleString('en-KE')} ({(100 - metrics.weekendSpendPercentage).toFixed(1)}%)
                </Text>
              </Group>
              <Progress value={100 - metrics.weekendSpendPercentage} color="blue" radius="xl" size="md" />
            </div>
          </Stack>

          <Text size="xs" c="dimmed" mt="md">
            {metrics.weekendSpendPercentage > 40
              ? 'Over 40% of your outflow occurs on weekends. Check restaurant and recreational spending for potential savings.'
              : 'Disciplined weekend spending! Your weekday and weekend velocity are well-balanced.'}
          </Text>
        </Paper>

        {/* Burn Rate & Runway */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="sm">
            <div>
              <Text fw={700} size="sm">
                Cash Velocity & Average Daily Burn
              </Text>
              <Text size="xs" c="dimmed">
                Pace of outflow across the statement timeframe
              </Text>
            </div>
            <Badge color="blue" variant="light">
              Velocity Metric
            </Badge>
          </Group>

          <Group align="baseline" gap="xs" mt="md">
            <Text fw={800} size="2rem" c="blue.7">
              KES {Math.round(metrics.avgDailySpend).toLocaleString('en-KE')}
            </Text>
            <Text size="sm" c="dimmed">
              / day
            </Text>
          </Group>

          <Text size="xs" c="dimmed" mt="xs">
            Based on active statement period. Maintaining daily spending under your daily income allows consistent emergency fund growth.
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Top Merchants & Counterparties */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center" mb="sm">
          <Group gap="xs">
            <ThemeIcon color="cyan" variant="light" size="md">
              <IconBuildingStore size={18} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm">
                Top Spending Counterparties & Merchants
              </Text>
              <Text size="xs" c="dimmed">
                Aggregated total payments grouped by recipient
              </Text>
            </div>
          </Group>
          <Badge variant="outline" color="gray">
            Top 10 Entities
          </Badge>
        </Group>

        <Table verticalSpacing="xs" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Recipient / Merchant Name</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Transactions</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Total Amount (KES)</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {metrics.topCounterparties.map((cp, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>
                  <Text size="sm" fw={600}>
                    {cp.name}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge size="xs" color="gray" variant="light">
                    {cp.category}
                  </Badge>
                </Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <Badge size="xs" variant="outline" color="blue">
                    {cp.count}x
                  </Badge>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="sm" fw={700} c="red.7">
                    KES {cp.totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
};
