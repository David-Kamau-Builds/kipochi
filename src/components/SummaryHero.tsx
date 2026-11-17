import React from 'react';
import { Paper, Group, Text, Badge, SimpleGrid, ThemeIcon, Stack, RingProgress } from '@mantine/core';
import { IconArrowDownLeft, IconArrowUpRight, IconWallet, IconHeartRateMonitor, IconUser } from '@tabler/icons-react';
import { FinancialHealthMetrics, StatementMetadata } from '../types/transaction';

interface SummaryHeroProps {
  metadata: StatementMetadata;
  metrics: FinancialHealthMetrics;
}

export const SummaryHero: React.FC<SummaryHeroProps> = ({ metadata, metrics }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'teal';
    if (score >= 65) return 'blue';
    if (score >= 45) return 'yellow';
    return 'red';
  };

  const scoreColor = getScoreColor(metrics.score);

  return (
    <Stack gap="md">
      {/* Account Info Banner */}
      <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="xl" variant="light" color="teal">
              <IconUser size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="md">
                {metadata.customerName || 'M-Pesa Account Holder'}
              </Text>
              <Text size="xs" c="dimmed">
                {metadata.phoneNumber ? `Phone: ${metadata.phoneNumber}` : 'Account Verified'}
                {metadata.statementPeriod && ` • Period: ${metadata.statementPeriod}`}
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <Badge color={scoreColor} size="lg" variant="light">
              Health Grade: {metrics.grade} ({metrics.score}/100)
            </Badge>
          </Group>
        </Group>
      </Paper>

      {/* KPI Cards Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        {/* Money In */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Total Inflow (Paid In)
            </Text>
            <ThemeIcon color="teal" variant="light" size="md" radius="md">
              <IconArrowDownLeft size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="xl" mt="xs" c="teal.7">
            KES {metrics.totalIn.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Income, P2P receipts & deposits
          </Text>
        </Paper>

        {/* Money Out */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Total Outflow (Withdrawn)
            </Text>
            <ThemeIcon color="red" variant="light" size="md" radius="md">
              <IconArrowUpRight size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="xl" mt="xs" c="red.7">
            KES {metrics.totalOut.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Spends, Paybills, Tills & Airtime
          </Text>
        </Paper>

        {/* Net Savings */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Net Savings / Flow
            </Text>
            <ThemeIcon color={metrics.netSavings >= 0 ? 'green' : 'orange'} variant="light" size="md" radius="md">
              <IconWallet size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="xl" mt="xs" c={metrics.netSavings >= 0 ? 'green.7' : 'orange.7'}>
            {metrics.netSavings >= 0 ? '+' : ''}
            KES {metrics.netSavings.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Savings rate: {metrics.savingsRate.toFixed(1)}% of total income
          </Text>
        </Paper>

        {/* Health Score Mini Widget */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Financial Score
              </Text>
              <Text fw={800} size="xl" mt="xs" c={`${scoreColor}.7`}>
                {metrics.score} <Text component="span" size="sm" fw={500} c="dimmed">/ 100</Text>
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {metrics.grade} financial wellness
              </Text>
            </div>
            <RingProgress
              size={65}
              thickness={6}
              roundCaps
              sections={[{ value: metrics.score, color: scoreColor }]}
              label={
                <ThemeIcon color={scoreColor} variant="subtle" size="xs" mx="auto" style={{ display: 'flex' }}>
                  <IconHeartRateMonitor size={16} />
                </ThemeIcon>
              }
            />
          </Group>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
};
