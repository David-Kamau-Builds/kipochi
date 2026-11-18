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
  Progress,
  Slider,
  Card,
  RingProgress,
  Center,
  Button,
} from '@mantine/core';
import {
  IconRepeat,
  IconUsers,
  IconMoonStars,
  IconHourglassEmpty,
  IconBuildingBank,
  IconCalculator,
  IconDownload,
  IconSparkles,
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import {
  RecurringBill,
  RunwayInsight,
  SocialContact,
  StatutoryRecord,
  TimeOfDayInsight,
} from '../../types/transaction';

interface AdvancedIntelligenceProps {
  recurringBills: RecurringBill[];
  socialContacts: SocialContact[];
  timeOfDayInsights: TimeOfDayInsight;
  statutoryRecords: StatutoryRecord[];
  runwayInsight: RunwayInsight;
  totalOut: number;
}

export const AdvancedIntelligence: React.FC<AdvancedIntelligenceProps> = ({
  recurringBills,
  socialContacts,
  timeOfDayInsights,
  statutoryRecords,
  runwayInsight,
  totalOut,
}) => {
  // What-If Simulator state: percentage reduction in discretionary/wants spend
  const [savingsPercentage, setSavingsPercentage] = useState(20);

  // Approximate monthly spend
  const estimatedMonthlySpend = totalOut > 0 ? totalOut / 3 : 50000;
  const discretionaryMonthly = estimatedMonthlySpend * 0.35; // ~35% on wants
  const monthlySaved = (discretionaryMonthly * savingsPercentage) / 100;

  // MMF Compound calculation at 13% annualized return
  const monthlyRate = 0.13 / 12;
  const calculateMmfReturn = (months: number, pmt: number) => {
    let fv = 0;
    for (let i = 0; i < months; i++) {
      fv = (fv + pmt) * (1 + monthlyRate);
    }
    return Math.round(fv);
  };

  const sixMonthValue = calculateMmfReturn(6, monthlySaved);
  const oneYearValue = calculateMmfReturn(12, monthlySaved);

  const totalCommittedBills = recurringBills.reduce((sum, b) => sum + b.averageAmount, 0);

  // Export Statutory receipts
  const handleExportStatutory = () => {
    const flatRows: any[] = [];
    for (const rec of statutoryRecords) {
      for (const r of rec.receipts) {
        flatRows.push({
          'Authority / Type': rec.type,
          'Recipient / Paybill': rec.recipient,
          'Receipt No': r.receiptNo,
          'Date': r.date,
          'Amount (KES)': r.amount,
          'Full Details': r.details,
        });
      }
    }
    const ws = XLSX.utils.json_to_sheet(flatRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statutory-Taxes');
    XLSX.writeFile(wb, 'Kipochi-Tax-Statutory-Audit.xlsx');
  };

  return (
    <Stack gap="lg">
      {/* 1. Cash Runway & Time-of-Day Top Row */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Runway Buffer */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="sm">
            <Group gap="xs">
              <ThemeIcon
                color={runwayInsight.status === 'Healthy' ? 'teal' : runwayInsight.status === 'Moderate' ? 'yellow' : 'red'}
                variant="light"
                size="md"
              >
                <IconHourglassEmpty size={18} />
              </ThemeIcon>
              <div>
                <Text fw={700} size="sm">
                  Emergency Cash Runway & Burn Rate
                </Text>
                <Text size="xs" c="dimmed">
                  Projected liquidity based on ending balance vs average daily burn
                </Text>
              </div>
            </Group>

            <Badge
              color={runwayInsight.status === 'Healthy' ? 'teal' : runwayInsight.status === 'Moderate' ? 'yellow' : 'red'}
            >
              {runwayInsight.status}
            </Badge>
          </Group>

          <Group align="baseline" gap="xs" mt="md">
            <Text
              fw={800}
              size="2.2rem"
              c={runwayInsight.status === 'Healthy' ? 'teal.7' : runwayInsight.status === 'Moderate' ? 'yellow.8' : 'red.7'}
            >
              {runwayInsight.runwayDays > 90 ? '90+' : runwayInsight.runwayDays}{' '}
              <Text component="span" size="sm" fw={600} c="dimmed">
                Days
              </Text>
            </Text>
          </Group>

          <Text size="xs" c="dimmed" mt="xs">
            Ending Balance: <strong>KES {runwayInsight.closingBalance.toLocaleString()}</strong> • Average Daily Spend:{' '}
            <strong>KES {Math.round(runwayInsight.avgDailyBurn).toLocaleString()}/day</strong>.
          </Text>
        </Paper>

        {/* Time of Day Clock */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="sm">
            <Group gap="xs">
              <ThemeIcon color="indigo" variant="light" size="md">
                <IconMoonStars size={18} />
              </ThemeIcon>
              <div>
                <Text fw={700} size="sm">
                  Time-of-Day & "Late-Night Tax" Heatmap
                </Text>
                <Text size="xs" c="dimmed">
                  Spending distributed across daytime routine vs late-night hours
                </Text>
              </div>
            </Group>

            <Badge color={timeOfDayInsights.lateNight.percentage > 15 ? 'orange' : 'teal'}>
              {timeOfDayInsights.lateNight.percentage.toFixed(1)}% Late-Night
            </Badge>
          </Group>

          <Stack gap="xs" mt="md">
            <div>
              <Group justify="space-between" mb={2}>
                <Text size="xs">Morning (6 AM – 11 AM)</Text>
                <Text size="xs" fw={700}>
                  KES {timeOfDayInsights.morning.total.toLocaleString()} ({timeOfDayInsights.morning.percentage.toFixed(0)}%)
                </Text>
              </Group>
              <Progress value={timeOfDayInsights.morning.percentage} color="cyan" size="xs" radius="xl" />
            </div>

            <div>
              <Group justify="space-between" mb={2}>
                <Text size="xs">Workday (11 AM – 5 PM)</Text>
                <Text size="xs" fw={700}>
                  KES {timeOfDayInsights.workday.total.toLocaleString()} ({timeOfDayInsights.workday.percentage.toFixed(0)}%)
                </Text>
              </Group>
              <Progress value={timeOfDayInsights.workday.percentage} color="blue" size="xs" radius="xl" />
            </div>

            <div>
              <Group justify="space-between" mb={2}>
                <Text size="xs">Evening (5 PM – 10 PM)</Text>
                <Text size="xs" fw={700}>
                  KES {timeOfDayInsights.evening.total.toLocaleString()} ({timeOfDayInsights.evening.percentage.toFixed(0)}%)
                </Text>
              </Group>
              <Progress value={timeOfDayInsights.evening.percentage} color="indigo" size="xs" radius="xl" />
            </div>

            <div>
              <Group justify="space-between" mb={2}>
                <Text size="xs" fw={600} c="orange.7">
                  Late-Night Tax (10 PM – 5 AM)
                </Text>
                <Text size="xs" fw={700} c="orange.7">
                  KES {timeOfDayInsights.lateNight.total.toLocaleString()} ({timeOfDayInsights.lateNight.percentage.toFixed(0)}%)
                </Text>
              </Group>
              <Progress value={timeOfDayInsights.lateNight.percentage} color="orange" size="xs" radius="xl" />
            </div>
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* 2. Interactive "What-If" MMF Wealth Growth Simulator */}
      <Paper withBorder p="lg" radius="md">
        <Group justify="space-between" align="center" mb="md" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon color="teal" variant="light" size="md">
              <IconCalculator size={18} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="md">
                Interactive "What-If" Wealth Growth Simulator
              </Text>
              <Text size="xs" c="dimmed">
                See what happens when you trim discretionary spending and divert it into a 13% p.a. Kenyan Money Market Fund (MMF)
              </Text>
            </div>
          </Group>
          <Badge color="teal" size="lg" variant="light">
            MMF Return: 13.0% p.a.
          </Badge>
        </Group>

        <Stack gap="md" mt="sm">
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600}>
                Reduce Discretionary "Wants" Spending by:
              </Text>
              <Badge color="teal" size="md">
                {savingsPercentage}% reduction
              </Badge>
            </Group>
            <Slider
              value={savingsPercentage}
              onChange={setSavingsPercentage}
              min={5}
              max={50}
              step={5}
              marks={[
                { value: 10, label: '10%' },
                { value: 20, label: '20%' },
                { value: 30, label: '30%' },
                { value: 40, label: '40%' },
                { value: 50, label: '50%' },
              ]}
              color="teal"
            />
          </div>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="md">
            <Paper withBorder p="md" radius="md">
              <Text size="xs" c="dimmed" fw={600}>
                Monthly Shillings Preserved
              </Text>
              <Text fw={800} size="xl" mt="xs" c="teal.7">
                KES {Math.round(monthlySaved).toLocaleString()}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Saved every month from dining & leisure
              </Text>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Text size="xs" c="dimmed" fw={600}>
                6-Month MMF Growth (13% p.a.)
              </Text>
              <Text fw={800} size="xl" mt="xs" c="blue.7">
                KES {sixMonthValue.toLocaleString()}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Principal + compound interest accumulated
              </Text>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Text size="xs" c="dimmed" fw={600}>
                1-Year MMF Emergency Float
              </Text>
              <Text fw={800} size="xl" mt="xs" c="green.7">
                KES {oneYearValue.toLocaleString()}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Full emergency fund established
              </Text>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Paper>

      {/* 3. Recurring Bills & Fixed Commitments Radar */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center" mb="sm">
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" size="md">
              <IconRepeat size={18} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm">
                Recurring Bills & Fixed Commitments Radar
              </Text>
              <Text size="xs" c="dimmed">
                Tracks predictable monthly living costs (KPLC, Internet, Rent, Subscriptions)
              </Text>
            </div>
          </Group>
          <Badge variant="outline" color="blue">
            Estimated Monthly Committed: KES {Math.round(totalCommittedBills).toLocaleString()}
          </Badge>
        </Group>

        <Table verticalSpacing="xs" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Billed Provider / Merchant</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Payments</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Average / Payment</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Total Committed</Table.Th>
              <Table.Th>Last Paid Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {recurringBills.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">No recurring bill paybills detected.</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              recurringBills.map((b, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {b.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" color="gray" variant="light">
                      {b.category}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Badge size="xs" variant="outline" color="blue">
                      {b.frequency}x
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text size="xs" fw={600}>
                      KES {Math.round(b.averageAmount).toLocaleString()}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text size="sm" fw={700} c="red.7">
                      KES {b.totalPaid.toLocaleString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {b.lastPaidDate}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* 4. P2P Social Relationship & Net Flow Matrix */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center" mb="sm">
          <Group gap="xs">
            <ThemeIcon color="orange" variant="light" size="md">
              <IconUsers size={18} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm">
                P2P Social Relationship Matrix
              </Text>
              <Text size="xs" c="dimmed">
                Tracks who you send money to vs receive money from (Beneficiaries, Contributors, Reciprocals)
              </Text>
            </div>
          </Group>
          <Badge variant="light" color="orange">
            {socialContacts.length} Contacts Analyzed
          </Badge>
        </Group>

        <Table verticalSpacing="xs" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Contact Name / Number</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Total Sent (KES)</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Total Received (KES)</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Net Flow</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Transfers</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {socialContacts.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">No peer-to-peer transfers found.</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              socialContacts.map((c, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {c.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="xs"
                      color={
                        c.relationshipType === 'Beneficiary'
                          ? 'orange'
                          : c.relationshipType === 'Contributor'
                          ? 'teal'
                          : 'gray'
                      }
                    >
                      {c.relationshipType}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text size="xs" c="red.7" fw={600}>
                      {c.sentTotal > 0 ? `-KES ${c.sentTotal.toLocaleString()}` : '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text size="xs" c="teal.7" fw={600}>
                      {c.receivedTotal > 0 ? `+KES ${c.receivedTotal.toLocaleString()}` : '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text
                      size="sm"
                      fw={700}
                      c={c.netFlow > 0 ? 'teal.7' : c.netFlow < 0 ? 'orange.7' : 'dimmed'}
                    >
                      {c.netFlow > 0 ? '+' : ''}
                      KES {c.netFlow.toLocaleString()}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Badge size="xs" variant="outline" color="gray">
                      {c.txCount}x
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* 5. eCitizen & Statutory Tax Filing Records */}
      {statutoryRecords.length > 0 && (
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="sm">
            <Group gap="xs">
              <ThemeIcon color="green" variant="light" size="md">
                <IconBuildingBank size={18} />
              </ThemeIcon>
              <div>
                <Text fw={700} size="sm">
                  eCitizen & Statutory Tax Filing Audit
                </Text>
                <Text size="xs" c="dimmed">
                  Official payments to KRA, eCitizen, NSSF, and SHIF/NHIF for bookkeeping and tax returns
                </Text>
              </div>
            </Group>

            <Button
              size="xs"
              variant="outline"
              color="green"
              leftSection={<IconDownload size={14} />}
              onClick={handleExportStatutory}
            >
              Export Tax Audit Sheet
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm" mt="md">
            {statutoryRecords.map((rec) => (
              <Paper key={rec.type} withBorder p="sm" radius="md">
                <Group justify="space-between" mb={4}>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    {rec.type}
                  </Text>
                  <Badge size="xs" color="green">
                    {rec.receipts.length} receipt{rec.receipts.length > 1 ? 's' : ''}
                  </Badge>
                </Group>
                <Text fw={800} size="lg" c="green.8">
                  KES {rec.totalAmount.toLocaleString()}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {rec.recipient}
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Paper>
      )}
    </Stack>
  );
};
