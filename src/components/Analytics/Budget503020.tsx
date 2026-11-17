import React from 'react';
import { Paper, SimpleGrid, Group, Text, ThemeIcon, Progress, Stack, Badge, RingProgress, Center } from '@mantine/core';
import { IconScale, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { FinancialHealthMetrics } from '../../types/transaction';

interface Budget503020Props {
  metrics: FinancialHealthMetrics;
}

export const Budget503020: React.FC<Budget503020Props> = ({ metrics }) => {
  const { needs, needsPercentage, wants, wantsPercentage, savings, savingsPercentage } =
    metrics.budgetBreakdown;

  return (
    <Stack gap="md">
      {/* Header Banner */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon color="grape" size="lg" radius="md" variant="light">
              <IconScale size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="md">
                50 / 30 / 20 Budget Health Breakdown
              </Text>
              <Text size="xs" c="dimmed">
                Evaluates your M-Pesa spending structure against the gold-standard personal finance rule
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <Badge color="grape" size="lg" variant="light">
              Total Outflows Analyzed: KES {metrics.totalOut.toLocaleString('en-KE')}
            </Badge>
          </Group>
        </Group>
      </Paper>

      {/* 3 Pillars: Needs, Wants, Savings */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {/* Needs (Target: 50%) */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center">
            <div>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                Needs (Essential Bills)
              </Text>
              <Text fw={800} size="xl" mt="xs" c="blue.7">
                {needsPercentage.toFixed(1)}%
              </Text>
              <Text size="xs" c="dimmed">
                Target: ≤ 50%
              </Text>
            </div>
            <Center>
              <RingProgress
                size={75}
                thickness={7}
                roundCaps
                sections={[{ value: Math.min(100, needsPercentage), color: needsPercentage <= 60 ? 'blue' : 'orange' }]}
                label={
                  <Center>
                    {needsPercentage <= 60 ? <IconCheck size={18} color="blue" /> : <IconAlertCircle size={18} color="orange" />}
                  </Center>
                }
              />
            </Center>
          </Group>

          <Text fw={700} size="md" mt="md">
            KES {needs.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Utilities (KPLC, Water, WiFi), Groceries, Health, School Fees, Fuel
          </Text>

          <Progress value={Math.min(100, needsPercentage)} color="blue" mt="md" radius="xl" />
        </Paper>

        {/* Wants (Target: 30%) */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center">
            <div>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                Wants (Discretionary)
              </Text>
              <Text fw={800} size="xl" mt="xs" c={wantsPercentage <= 35 ? 'indigo.7' : 'red.7'}>
                {wantsPercentage.toFixed(1)}%
              </Text>
              <Text size="xs" c="dimmed">
                Target: ≤ 30%
              </Text>
            </div>
            <Center>
              <RingProgress
                size={75}
                thickness={7}
                roundCaps
                sections={[{ value: Math.min(100, wantsPercentage), color: wantsPercentage <= 35 ? 'indigo' : 'red' }]}
                label={
                  <Center>
                    {wantsPercentage <= 35 ? <IconCheck size={18} color="indigo" /> : <IconAlertCircle size={18} color="red" />}
                  </Center>
                }
              />
            </Center>
          </Group>

          <Text fw={700} size="md" mt="md">
            KES {wants.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Dining, Nightlife, Bars, Leisure, Entertainment, P2P Transfers
          </Text>

          <Progress value={Math.min(100, wantsPercentage)} color={wantsPercentage <= 35 ? 'indigo' : 'red'} mt="md" radius="xl" />
        </Paper>

        {/* Savings & Debt Servicing (Target: 20%) */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center">
            <div>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                Savings & Bank Transfers
              </Text>
              <Text fw={800} size="xl" mt="xs" c={savingsPercentage >= 15 ? 'teal.7' : 'yellow.7'}>
                {savingsPercentage.toFixed(1)}%
              </Text>
              <Text size="xs" c="dimmed">
                Target: ≥ 20%
              </Text>
            </div>
            <Center>
              <RingProgress
                size={75}
                thickness={7}
                roundCaps
                sections={[{ value: Math.min(100, savingsPercentage * 5), color: savingsPercentage >= 15 ? 'teal' : 'yellow' }]}
                label={
                  <Center>
                    {savingsPercentage >= 15 ? <IconCheck size={18} color="teal" /> : <IconAlertCircle size={18} color="orange" />}
                  </Center>
                }
              />
            </Center>
          </Group>

          <Text fw={700} size="md" mt="md">
            KES {savings.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Bank deposits (KCB, Equity), SACCOs, MMF investments, Loan repayments
          </Text>

          <Progress value={Math.min(100, savingsPercentage * 5)} color="teal" mt="md" radius="xl" />
        </Paper>
      </SimpleGrid>

      {/* Visual Bar Comparison */}
      <Paper withBorder p="md" radius="md">
        <Text fw={700} size="sm" mb="xs">
          Your Outflow Distribution vs Recommended 50/30/20 Standard
        </Text>

        <Progress.Root size="xl" radius="md">
          <Progress.Section value={needsPercentage} color="blue">
            <Progress.Label>Needs ({needsPercentage.toFixed(0)}%)</Progress.Label>
          </Progress.Section>
          <Progress.Section value={wantsPercentage} color="indigo">
            <Progress.Label>Wants ({wantsPercentage.toFixed(0)}%)</Progress.Label>
          </Progress.Section>
          <Progress.Section value={savingsPercentage} color="teal">
            <Progress.Label>Savings ({savingsPercentage.toFixed(0)}%)</Progress.Label>
          </Progress.Section>
        </Progress.Root>

        <Group justify="space-between" mt="sm">
          <Group gap="xs">
            <Badge size="xs" color="blue">Needs (Target 50%)</Badge>
            <Badge size="xs" color="indigo">Wants (Target 30%)</Badge>
            <Badge size="xs" color="teal">Savings (Target 20%)</Badge>
          </Group>
          <Text size="xs" c="dimmed">
            {wantsPercentage > 35
              ? 'Recommendation: Reallocate 5-10% from "Wants" into your MMF or Emergency Fund.'
              : 'Well-balanced allocation!'}
          </Text>
        </Group>
      </Paper>
    </Stack>
  );
};
