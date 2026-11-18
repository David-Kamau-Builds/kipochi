import React, { useState, useMemo } from 'react';
import {
  Table,
  TextInput,
  Select,
  Paper,
  Group,
  Text,
  Badge,
  Pagination,
  Button,
  Stack,
  CopyButton,
  ActionIcon,
  Tooltip,
  Box,
  rem,
} from '@mantine/core';
import {
  IconSearch,
  IconArrowUp,
  IconArrowDown,
  IconDownload,
  IconCopy,
  IconCheck,
  IconFilter,
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import { Transaction, TransactionCategory } from '../types/transaction';

interface TransactionTableProps {
  transactions: Transaction[];
  type: 'IN' | 'OUT';
  title: string;
}

type SortField = 'amount' | 'dateTime' | 'receiptNo' | 'category';
type SortDirection = 'asc' | 'desc';

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, type, title }) => {
  // Requirement: Orders the amount from highest to lowest by default
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Extract unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category));
    return Array.from(set).map((cat) => ({ value: cat, label: cat }));
  }, [transactions]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // If clicking amount, default to desc; else asc
      setSortDirection(field === 'amount' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  // Filter & Sort logic
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((t) => {
      // Category filter
      if (selectedCategory && t.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesDetails = t.details.toLowerCase().includes(query);
        const matchesCounterparty = t.counterparty.toLowerCase().includes(query);
        const matchesReceipt = t.receiptNo.toLowerCase().includes(query);
        if (!matchesDetails && !matchesCounterparty && !matchesReceipt) {
          return false;
        }
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'dateTime') {
        comparison = a.dateTime.getTime() - b.dateTime.getTime();
      } else if (sortField === 'receiptNo') {
        comparison = a.receiptNo.localeCompare(b.receiptNo);
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [transactions, search, selectedCategory, sortField, sortDirection]);

  // Paginated slice
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, page]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;

  // Category Badge Colors
  const getCategoryBadgeColor = (category: TransactionCategory) => {
    switch (category) {
      case 'Paybill':
        return 'blue';
      case 'Buy Goods (Till)':
        return 'indigo';
      case 'Send Money (P2P)':
        return 'orange';
      case 'Received Money (P2P)':
        return 'teal';
      case 'Airtime & Bundles':
        return 'cyan';
      case 'Fuliza / Loan':
        return 'red';
      case 'Cash Withdrawal':
        return 'grape';
      case 'Bank Transfer / Deposit':
        return 'green';
      case 'M-Pesa Tariff / Fee':
        return 'yellow';
      case 'Statutory / Tax / eCitizen':
        return 'teal';
      default:
        return 'gray';
    }
  };

  // Export to Excel
  const handleExport = () => {
    const exportRows = filteredTransactions.map((t) => ({
      'Receipt No': t.receiptNo,
      'Date & Time': t.dateTime.toISOString().replace('T', ' ').substring(0, 19),
      'Type': t.type,
      'Category': t.category,
      'Counterparty / Recipient': t.counterparty,
      'Full Details': t.details,
      'Amount (KES)': t.amount,
      'Balance (KES)': t.balance,
      'Budget Bucket': t.budgetBucket,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${type}-Transactions`);
    XLSX.writeFile(workbook, `M-Pesa-${type}-Transactions.xlsx`);
  };

  return (
    <Paper withBorder p="md" radius="md" shadow="xs">
      <Stack gap="md">
        {/* Header & Controls */}
        <Group justify="space-between" align="center" wrap="wrap">
          <div>
            <Group gap="xs">
              <Text fw={700} size="lg">
                {title}
              </Text>
              <Badge color={type === 'OUT' ? 'red' : 'teal'} variant="light">
                {filteredTransactions.length} transactions
              </Badge>
              {sortField === 'amount' && sortDirection === 'desc' && (
                <Badge color="gray" variant="outline" size="sm">
                  Sorted Highest → Lowest
                </Badge>
              )}
            </Group>
            <Text size="xs" c="dimmed">
              Ordered by amount highest to lowest. Click table headers to change sorting.
            </Text>
          </div>

          <Group gap="sm">
            <Button
              variant="outline"
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={handleExport}
              disabled={filteredTransactions.length === 0}
            >
              Export Excel
            </Button>
          </Group>
        </Group>

        {/* Search & Filter Bar */}
        <Group grow wrap="wrap">
          <TextInput
            placeholder="Search by recipient, Paybill, Till, or Receipt No..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            rightSection={
              search ? (
                <ActionIcon size="xs" color="gray" variant="subtle" onClick={() => setSearch('')}>
                  ×
                </ActionIcon>
              ) : null
            }
          />

          <Select
            placeholder="Filter by Category"
            leftSection={<IconFilter size={16} />}
            data={[{ value: '', label: 'All Categories' }, ...categories]}
            value={selectedCategory || ''}
            onChange={(val) => {
              setSelectedCategory(val ? val : null);
              setPage(1);
            }}
            clearable
          />
        </Group>

        {/* Mantine Table */}
        <Box style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('receiptNo')}
                >
                  <Group gap={4}>
                    <Text fw={600} size="sm">Receipt No.</Text>
                    {sortField === 'receiptNo' &&
                      (sortDirection === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />)}
                  </Group>
                </Table.Th>

                <Table.Th
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('dateTime')}
                >
                  <Group gap={4}>
                    <Text fw={600} size="sm">Date & Time</Text>
                    {sortField === 'dateTime' &&
                      (sortDirection === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />)}
                  </Group>
                </Table.Th>

                <Table.Th style={{ width: '35%' }}>
                  <Text fw={600} size="sm">Details / Counterparty</Text>
                </Table.Th>

                <Table.Th
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('category')}
                >
                  <Group gap={4}>
                    <Text fw={600} size="sm">Category</Text>
                    {sortField === 'category' &&
                      (sortDirection === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />)}
                  </Group>
                </Table.Th>

                <Table.Th
                  style={{ cursor: 'pointer', textAlign: 'right', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('amount')}
                >
                  <Group gap={4} justify="flex-end">
                    <Text fw={700} size="sm" c={type === 'OUT' ? 'red.7' : 'teal.7'}>
                      Amount (KES)
                    </Text>
                    {sortField === 'amount' &&
                      (sortDirection === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />)}
                  </Group>
                </Table.Th>

                <Table.Th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Text fw={600} size="sm">Balance (KES)</Text>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {paginatedData.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: 'center', padding: rem(32) }}>
                    <Text c="dimmed">No transactions found matching your search and filter criteria.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedData.map((t) => (
                  <Table.Tr key={t.id}>
                    {/* Receipt No Badge with Copy */}
                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                      <Group gap={4}>
                        <Badge variant="light" color="gray" size="sm">
                          {t.receiptNo}
                        </Badge>
                        <CopyButton value={t.receiptNo} timeout={2000}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied' : 'Copy Receipt No'} withArrow position="right">
                              <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" size="xs" onClick={copy}>
                                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                      </Group>
                    </Table.Td>

                    {/* Date & Time */}
                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                      <Text size="xs" fw={500}>
                        {t.dateTime.toISOString().replace('T', ' ').substring(0, 10)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t.dateTime.toISOString().substring(11, 19)}
                        {t.isWeekend && (
                          <Badge size="xs" variant="dot" color="orange" ml={6}>
                            Weekend
                          </Badge>
                        )}
                      </Text>
                    </Table.Td>

                    {/* Details / Counterparty */}
                    <Table.Td>
                      <Text size="sm" fw={600}>
                        {t.counterparty}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {t.details}
                      </Text>
                    </Table.Td>

                    {/* Category */}
                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                      <Badge color={getCategoryBadgeColor(t.category)} variant="light" size="sm">
                        {t.category}
                      </Badge>
                    </Table.Td>

                    {/* Amount (KES) */}
                    <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Text fw={700} size="sm" c={type === 'OUT' ? 'red.7' : 'teal.7'}>
                        {type === 'OUT' ? '-' : '+'}
                        KES {t.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </Text>
                    </Table.Td>

                    {/* Running Balance */}
                    <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Text size="xs" c="dimmed">
                        {t.balance > 0 ? `KES ${t.balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : '—'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Box>

        {/* Pagination & Count */}
        <Group justify="space-between" align="center" mt="xs">
          <Text size="xs" c="dimmed">
            Showing {filteredTransactions.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </Text>

          {totalPages > 1 && (
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="md" />
          )}
        </Group>
      </Stack>
    </Paper>
  );
};
