import React, { useState, useMemo } from 'react';
import {
  AppShell,
  Container,
  Group,
  Title,
  Text,
  Button,
  Tabs,
  Badge,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  Stack,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconReceipt2,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconFlame,
  IconHeartRateMonitor,
  IconScale,
  IconUpload,
  IconShieldCheck,
  IconChartLine,
} from '@tabler/icons-react';
import { StatementMetadata, Transaction } from './types/transaction';
import { ParseResult } from './utils/parser';
import { computeFinancialHealthMetrics } from './utils/analytics';
import { FileUpload } from './components/FileUpload';
import { PasswordModal } from './components/PasswordModal';
import { SummaryHero } from './components/SummaryHero';
import { TransactionTable } from './components/TransactionTable';
import { TopSpends } from './components/Analytics/TopSpends';
import { LeaksAuditor } from './components/Analytics/LeaksAuditor';
import { Budget503020 } from './components/Analytics/Budget503020';
import { Behavioral } from './components/Analytics/Behavioral';
import { HealthScoreCard } from './components/Analytics/HealthScoreCard';
import { MonthlyAndTrends } from './components/Analytics/MonthlyAndTrends';

export const App: React.FC = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metadata, setMetadata] = useState<StatementMetadata>({});
  const [activeTab, setActiveTab] = useState<string | null>('outflow');

  // Password modal state for encrypted PDFs
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPdfBuffer, setPendingPdfBuffer] = useState<ArrayBuffer | null>(null);

  const handleDataLoaded = (result: ParseResult) => {
    setTransactions(result.transactions);
    setMetadata(result.metadata);
    setActiveTab('outflow');
  };

  const handleRequestPassword = (file: File, buffer: ArrayBuffer) => {
    setPendingFile(file);
    setPendingPdfBuffer(buffer);
    setPasswordModalOpen(true);
  };

  const handleReset = () => {
    setTransactions([]);
    setMetadata({});
    setPendingFile(null);
    setPendingPdfBuffer(null);
  };

  // Compute all analytics and health metrics dynamically
  const metrics = useMemo(() => {
    return computeFinancialHealthMetrics(transactions);
  }, [transactions]);

  const spends = useMemo(() => transactions.filter((t) => t.type === 'OUT'), [transactions]);
  const incomes = useMemo(() => transactions.filter((t) => t.type === 'IN'), [transactions]);

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%" align="center">
            <Group gap="sm">
              <ThemeIcon size="lg" radius="md" color="teal" variant="filled">
                <IconReceipt2 size={22} />
              </ThemeIcon>
              <div>
                <Title order={3} size="h4" fw={800} style={{ letterSpacing: '-0.02em' }}>
                  Kipochi
                </Title>
                <Text size="xs" c="dimmed">
                  M-Pesa Spending Habits & Financial Health Intelligence
                </Text>
              </div>
            </Group>

            <Group gap="sm">
              {transactions.length > 0 && (
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  leftSection={<IconUpload size={14} />}
                  onClick={handleReset}
                >
                  Upload New Statement
                </Button>
              )}

              <ActionIcon
                onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
                variant="default"
                size="lg"
                aria-label="Toggle color scheme"
              >
                {computedColorScheme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" py="md">
          {transactions.length === 0 ? (
            /* Upload Screen */
            <Stack gap="xl" py="xl" maw={850} mx="auto">
              <Stack gap="xs" ta="center">
                <Badge size="lg" variant="light" color="teal" mx="auto">
                  100% Client-Side & Private
                </Badge>
                <Title order={1} size="h2" fw={900}>
                  Analyze Your M-Pesa Spending Habits
                </Title>
                <Text size="md" c="dimmed" maw={620} mx="auto">
                  Upload your Safaricom M-Pesa statement (PDF or Excel) to see searchable grids of your highest spends,
                  uncover hidden Fuliza and airtime leaks, and evaluate your financial health.
                </Text>
              </Stack>

              <FileUpload
                onDataLoaded={handleDataLoaded}
                onRequestPassword={handleRequestPassword}
              />

              <Group justify="center" gap="xl" mt="md">
                <Group gap="xs">
                  <IconShieldCheck size={18} color="var(--mantine-color-teal-6)" />
                  <Text size="xs" c="dimmed">
                    Decrypted locally in browser
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconReceipt2 size={18} color="var(--mantine-color-blue-6)" />
                  <Text size="xs" c="dimmed">
                    Supports Safaricom ID Passwords
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconHeartRateMonitor size={18} color="var(--mantine-color-orange-6)" />
                  <Text size="xs" c="dimmed">
                    50/30/20 Financial Health Score
                  </Text>
                </Group>
              </Group>
            </Stack>
          ) : (
            /* Statement Loaded Dashboard */
            <Stack gap="lg">
              {/* Summary KPIs */}
              <SummaryHero metadata={metadata} metrics={metrics} />

              <Divider my="xs" />

              {/* Main Tabbed Interface */}
              <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
                <Tabs.List mb="md">
                  <Tabs.Tab
                    value="outflow"
                    leftSection={<IconArrowUpRight size={16} color="var(--mantine-color-red-6)" />}
                  >
                    Amount Out (Spends){' '}
                    <Badge size="xs" color="red" variant="light" ml={6}>
                      {spends.length}
                    </Badge>
                  </Tabs.Tab>

                  <Tabs.Tab
                    value="inflow"
                    leftSection={<IconArrowDownLeft size={16} color="var(--mantine-color-teal-6)" />}
                  >
                    Amount In (Income){' '}
                    <Badge size="xs" color="teal" variant="light" ml={6}>
                      {incomes.length}
                    </Badge>
                  </Tabs.Tab>

                  <Tabs.Tab
                    value="top20"
                    leftSection={<IconFlame size={16} color="var(--mantine-color-orange-6)" />}
                  >
                    Top 20 Highest Spends
                  </Tabs.Tab>

                  <Tabs.Tab
                    value="trends"
                    leftSection={<IconChartLine size={16} color="var(--mantine-color-blue-6)" />}
                  >
                    Monthly & Trends
                  </Tabs.Tab>

                  <Tabs.Tab
                    value="leaks"
                    leftSection={<IconHeartRateMonitor size={16} color="var(--mantine-color-grape-6)" />}
                  >
                    Hidden Leaks & Fees
                  </Tabs.Tab>

                  <Tabs.Tab
                    value="budget"
                    leftSection={<IconScale size={16} color="var(--mantine-color-blue-6)" />}
                  >
                    50/30/20 & Habits
                  </Tabs.Tab>

                  <Tabs.Tab
                    value="health"
                    leftSection={<IconHeartRateMonitor size={16} color="var(--mantine-color-teal-6)" />}
                  >
                    Financial Health Score
                  </Tabs.Tab>
                </Tabs.List>

                {/* Tab 1: Amount Out Grid (Highest to Lowest by default) */}
                <Tabs.Panel value="outflow">
                  <TransactionTable
                    transactions={spends}
                    type="OUT"
                    title="Amount Out — Expenditure & Withdrawals"
                  />
                </Tabs.Panel>

                {/* Tab 2: Amount In Grid (Highest to Lowest by default) */}
                <Tabs.Panel value="inflow">
                  <TransactionTable
                    transactions={incomes}
                    type="IN"
                    title="Amount In — Inflow & Receipts"
                  />
                </Tabs.Panel>

                {/* Tab 3: Top 20 Highest Spends */}
                <Tabs.Panel value="top20">
                  <TopSpends transactions={transactions} totalOut={metrics.totalOut} />
                </Tabs.Panel>

                {/* Tab 4: Monthly & Performance Trends */}
                <Tabs.Panel value="trends">
                  <MonthlyAndTrends
                    monthlyMetrics={metrics.monthlyMetrics}
                    dayInsights={metrics.dayInsights}
                  />
                </Tabs.Panel>

                {/* Tab 5: Leaks & Fees Auditor */}
                <Tabs.Panel value="leaks">
                  <LeaksAuditor metrics={metrics} />
                </Tabs.Panel>

                {/* Tab 5: 50/30/20 & Behavioral Habits */}
                <Tabs.Panel value="budget">
                  <Stack gap="lg">
                    <Budget503020 metrics={metrics} />
                    <Behavioral metrics={metrics} />
                  </Stack>
                </Tabs.Panel>

                {/* Tab 6: Financial Health Score */}
                <Tabs.Panel value="health">
                  <HealthScoreCard metrics={metrics} />
                </Tabs.Panel>
              </Tabs>
            </Stack>
          )}
        </Container>
      </AppShell.Main>

      {/* Password Decryption Modal */}
      <PasswordModal
        opened={passwordModalOpen}
        file={pendingFile}
        fileBuffer={pendingPdfBuffer}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={(result) => {
          handleDataLoaded(result);
          setPasswordModalOpen(false);
        }}
      />
    </AppShell>
  );
};
export default App;
