import React from 'react';
import { Paper, Text, Group, Badge, Progress, Table, Stack, ThemeIcon, Alert } from '@mantine/core';
import { IconFlame, IconInfoCircle } from '@tabler/icons-react';
import { Transaction } from '../../types/transaction';

interface TopSpendsProps {
  transactions: Transaction[];
  totalOut: number;
}

export const TopSpends: React.FC<TopSpendsProps> = ({ transactions, totalOut }) => {
  const spends = transactions.filter((t) => t.type === 'OUT');
  const sorted = [...spends].sort((a, b) => b.amount - a.amount);
  const top20 = sorted.slice(0, 20);

  const top20Total = top20.reduce((acc, t) => acc + t.amount, 0);
  const top20Share = totalOut > 0 ? (top20Total / totalOut) * 100 : 0;
  const maxAmount = top20.length > 0 ? top20[0].amount : 1;

  return (
    <Stack gap="md">
      {/* Overview Card */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon color="red" size="lg" radius="md" variant="light">
              <IconFlame size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="md">
                Top 20 Highest Spends
              </Text>
              <Text size="xs" c="dimmed">
                Ranked by transaction amount to identify major capital outflows
              </Text>
            </div>
          </Group>

          <Group gap="md">
            <div>
              <Text size="xs" c="dimmed" ta="right">
                Top 20 Aggregate Spend
              </Text>
              <Text fw={800} size="md" c="red.7" ta="right">
                KES {top20Total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </Text>
            </div>
            <Badge color="red" size="lg" variant="light">
              {top20Share.toFixed(1)}% of all expenses
            </Badge>
          </Group>
        </Group>

        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mt="md" radius="sm">
          These 20 transactions make up <strong>{top20Share.toFixed(1)}%</strong> of your total money out.
          Managing or planning for these key lump-sum expenses yields the largest impact on your cash flow.
        </Alert>
      </Paper>

      {/* Top 20 Leaderboard Table */}
      <Paper withBorder p="md" radius="md">
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 60 }}>Rank</Table.Th>
              <Table.Th>Recipient / Merchant</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th style={{ width: '25%' }}>Share of Largest Spend</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Amount (KES)</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {top20.map((tx, idx) => {
              const relativePercent = (tx.amount / maxAmount) * 100;
              const totalShare = totalOut > 0 ? (tx.amount / totalOut) * 100 : 0;

              return (
                <Table.Tr key={tx.id}>
                  <Table.Td>
                    <Badge
                      size="sm"
                      variant={idx < 3 ? 'filled' : 'light'}
                      color={idx === 0 ? 'yellow' : idx === 1 ? 'gray' : idx === 2 ? 'orange' : 'blue'}
                    >
                      #{idx + 1}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} size="sm">
                      {tx.counterparty}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {tx.details}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" variant="outline" color="gray">
                      {tx.category}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {tx.dateTime.toISOString().substring(0, 10)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Progress value={relativePercent} color="red" size="sm" style={{ flex: 1 }} />
                      <Text size="xs" c="dimmed" style={{ width: 45, textAlign: 'right' }}>
                        {totalShare.toFixed(1)}%
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text fw={700} size="sm" c="red.7">
                      KES {tx.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
};
