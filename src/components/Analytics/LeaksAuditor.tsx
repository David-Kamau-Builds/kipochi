import React from 'react';
import { Paper, SimpleGrid, Group, Text, ThemeIcon, Stack, Alert, Badge } from '@mantine/core';
import { IconAlertTriangle, IconReceiptTax, IconDeviceMobileCharging, IconCoins, IconTrendingDown } from '@tabler/icons-react';
import { FinancialHealthMetrics } from '../../types/transaction';

interface LeaksAuditorProps {
  metrics: FinancialHealthMetrics;
}

export const LeaksAuditor: React.FC<LeaksAuditorProps> = ({ metrics }) => {
  const totalLeakage =
    metrics.totalFulizaSpent + metrics.estimatedTariffFees + metrics.airtimeMicroSpendTotal;

  return (
    <Stack gap="md">
      {/* Overview Banner */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon color="orange" size="lg" radius="md" variant="light">
              <IconAlertTriangle size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="md">
                Financial Leaks & Friction Auditor
              </Text>
              <Text size="xs" c="dimmed">
                Tracks hidden fees, overdrafts, and repetitive micro-transactions that quietly drain your wealth
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <Badge color="orange" size="lg" variant="light">
              Combined Leakage: KES {totalLeakage.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </Badge>
          </Group>
        </Group>
      </Paper>

      {/* 3 Core Leak Pillars */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {/* Fuliza Overdrafts */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Fuliza & Loan Repayments
            </Text>
            <ThemeIcon color="red" variant="light" size="md">
              <IconTrendingDown size={18} />
            </ThemeIcon>
          </Group>

          <Text fw={800} size="xl" mt="xs" c={metrics.totalFulizaSpent > 0 ? 'red.7' : 'teal.7'}>
            KES {metrics.totalFulizaSpent.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </Text>

          <Text size="xs" c="dimmed" mt={4}>
            {metrics.totalFulizaSpent > 0
              ? 'Facility fees and loan repayments deducted from deposits'
              : 'Zero Fuliza detected! Excellent debt avoidance.'}
          </Text>

          {metrics.totalFulizaSpent > 0 && (
            <Alert color="red" variant="light" mt="sm">
              Daily facility fees can exceed 100%+ annualized APR. Prioritize building an emergency float.
            </Alert>
          )}
        </Paper>

        {/* Safaricom Tariff Fees */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Estimated Tariff Friction
            </Text>
            <ThemeIcon color="orange" variant="light" size="md">
              <IconReceiptTax size={18} />
            </ThemeIcon>
          </Group>

          <Text fw={800} size="xl" mt="xs" c="orange.7">
            KES {metrics.estimatedTariffFees.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </Text>

          <Text size="xs" c="dimmed" mt={4}>
            Estimated agent withdrawal and P2P band charges
          </Text>

          <Alert color="orange" variant="light" mt="sm">
            Make payments directly via <strong>Buy Goods / Till</strong> (0% customer fee) instead of withdrawing cash.
          </Alert>
        </Paper>

        {/* Airtime Micro-Spends */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Airtime Micro-Spends (≤ KES 300)
            </Text>
            <ThemeIcon color="cyan" variant="light" size="md">
              <IconDeviceMobileCharging size={18} />
            </ThemeIcon>
          </Group>

          <Text fw={800} size="xl" mt="xs" c="cyan.7">
            KES {metrics.airtimeMicroSpendTotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </Text>

          <Text size="xs" c="dimmed" mt={4}>
            Across {metrics.airtimeCount} individual airtime/data top-ups
          </Text>

          <Alert color="cyan" variant="light" mt="sm">
            Buying daily micro-bundles costs up to 35% more than purchasing monthly or weekly data packages.
          </Alert>
        </Paper>
      </SimpleGrid>

      {/* Actionable Prescriptions */}
      <Paper withBorder p="md" radius="md">
        <Group gap="xs" mb="sm">
          <IconCoins size={18} color="var(--mantine-color-teal-6)" />
          <Text fw={700} size="sm">
            Wealth Preservation Checklist
          </Text>
        </Group>

        <Stack gap="xs">
          <Text size="sm">
            1. <strong>Favor Free Channels:</strong> Whenever shopping at supermarkets, retail shops, or restaurants, pay via Till (Buy Goods) rather than Paybill or Cash Withdrawal to avoid withdrawal charges.
          </Text>
          <Text size="sm">
            2. <strong>Consolidate P2P Transfers:</strong> Safaricom charges per transaction. Sending KES 5,000 once costs KES 57, whereas sending KES 1,000 five times costs KES 65+.
          </Text>
          <Text size="sm">
            3. <strong>Automate Monthly Bundles:</strong> Instead of daily KES 100 top-ups, allocate a fixed monthly airtime budget via Safaricom PostPay or Monthly Tunukiwa.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
};
