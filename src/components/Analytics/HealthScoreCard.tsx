import React from 'react';
import { Paper, Group, Text, ThemeIcon, Stack, RingProgress, Badge, SimpleGrid, List } from '@mantine/core';
import { IconHeartRateMonitor, IconCheck, IconTargetArrow, IconTrendingUp } from '@tabler/icons-react';
import { FinancialHealthMetrics } from '../../types/transaction';

interface HealthScoreCardProps {
  metrics: FinancialHealthMetrics;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ metrics }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'teal';
    if (score >= 65) return 'blue';
    if (score >= 45) return 'yellow';
    return 'red';
  };

  const scoreColor = getScoreColor(metrics.score);

  return (
    <Stack gap="md">
      {/* Main Score Hero Card */}
      <Paper withBorder p="xl" radius="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="xl">
            <RingProgress
              size={120}
              thickness={10}
              roundCaps
              sections={[{ value: metrics.score, color: scoreColor }]}
              label={
                <Text ta="center" fw={800} size="xl" c={`${scoreColor}.7`}>
                  {metrics.score}
                </Text>
              }
            />

            <div>
              <Group gap="xs">
                <Text fw={800} size="xl">
                  M-Pesa Financial Wellness Score
                </Text>
                <Badge color={scoreColor} size="lg" variant="light">
                  {metrics.grade}
                </Badge>
              </Group>

              <Text size="sm" c="dimmed" mt={4} style={{ maxWidth: 500 }}>
                This score algorithmically assesses your cash retention, debt independence from overdrafts (Fuliza),
                transaction fee friction, and alignment with the 50/30/20 personal budget guideline.
              </Text>
            </div>
          </Group>

          <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-body)">
            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={600}>
                Key Snapshot
              </Text>
              <Text size="xs">
                • Savings Rate: <strong>{metrics.savingsRate.toFixed(1)}%</strong>
              </Text>
              <Text size="xs">
                • Fuliza Repayments: <strong>KES {metrics.totalFulizaSpent.toLocaleString()}</strong>
              </Text>
              <Text size="xs">
                • Estimated Tariff Fees: <strong>KES {metrics.estimatedTariffFees.toLocaleString()}</strong>
              </Text>
            </Stack>
          </Paper>
        </Group>
      </Paper>

      {/* 4 Pillars Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Paper withBorder p="md" radius="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            1. Savings Margin
          </Text>
          <Text fw={800} size="lg" mt="xs" c={metrics.savingsRate > 15 ? 'teal.7' : 'yellow.7'}>
            {metrics.savingsRate.toFixed(1)}%
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Target: 20%+ of income retained
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            2. Overdraft Reliance
          </Text>
          <Text fw={800} size="lg" mt="xs" c={metrics.totalFulizaSpent === 0 ? 'teal.7' : 'red.7'}>
            {metrics.totalFulizaSpent === 0 ? 'Zero Debt' : `KES ${metrics.totalFulizaSpent.toLocaleString()}`}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Target: KES 0 Fuliza usage
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            3. Fee Efficiency
          </Text>
          <Text fw={800} size="lg" mt="xs" c={metrics.estimatedTariffFees < 1000 ? 'teal.7' : 'orange.7'}>
            KES {metrics.estimatedTariffFees.toLocaleString()}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Target: Minimize transfer & agent fees
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            4. Discretionary Balance
          </Text>
          <Text fw={800} size="lg" mt="xs" c={metrics.budgetBreakdown.wantsPercentage <= 30 ? 'teal.7' : 'indigo.7'}>
            {metrics.budgetBreakdown.wantsPercentage.toFixed(1)}%
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Target: ≤ 30% on Wants
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Actionable Prescriptions to Improve Financial Responsibility */}
      <Paper withBorder p="lg" radius="md">
        <Group gap="xs" mb="md">
          <ThemeIcon color="teal" variant="light" size="md">
            <IconTargetArrow size={18} />
          </ThemeIcon>
          <Text fw={700} size="md">
            Personalized Financial Recommendations
          </Text>
        </Group>

        <List
          spacing="sm"
          size="sm"
          icon={
            <ThemeIcon color="teal" size={20} radius="xl">
              <IconCheck size={12} />
            </ThemeIcon>
          }
        >
          {metrics.recommendations.map((rec, index) => (
            <List.Item key={index}>
              <Text size="sm">{rec}</Text>
            </List.Item>
          ))}
        </List>
      </Paper>
    </Stack>
  );
};
