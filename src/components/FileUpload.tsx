import React, { useState } from 'react';
import { Group, Text, rem, Paper, Button, Stack, Alert, LoadingOverlay } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { IconUpload, IconFileSpreadsheet, IconX, IconSparkles, IconShieldLock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { InvalidPasswordError, parseMpesaCsv, parseMpesaExcel, parseMpesaPdf, ParseResult, PasswordRequiredError } from '../utils/parser';
import { getSampleMpesaTransactions } from '../utils/sampleData';

interface FileUploadProps {
  onDataLoaded: (result: ParseResult) => void;
  onRequestPassword: (file: File, fileBuffer: ArrayBuffer) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onRequestPassword }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setError(null);
    setLoading(true);

    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        try {
          // Pass a fresh clone of arrayBuffer
          const result = await parseMpesaPdf(arrayBuffer.slice(0));
          onDataLoaded(result);
          notifications.show({
            title: 'Statement Parsed',
            message: `Extracted ${result.transactions.length} transactions successfully.`,
            color: 'teal',
          });
        } catch (err: any) {
          if (
            err instanceof PasswordRequiredError ||
            err instanceof InvalidPasswordError ||
            err.name === 'PasswordException' ||
            err.message?.includes('password') ||
            err.message?.includes('encrypted')
          ) {
            // Forward both the file and a fresh array buffer copy
            onRequestPassword(file, arrayBuffer.slice(0));
          } else {
            throw err;
          }
        }
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await parseMpesaExcel(arrayBuffer);
        onDataLoaded(result);
        notifications.show({
          title: 'Excel Statement Parsed',
          message: `Extracted ${result.transactions.length} transactions successfully.`,
          color: 'teal',
        });
      } else if (fileName.endsWith('.csv')) {
        const text = await file.text();
        const result = await parseMpesaCsv(text);
        onDataLoaded(result);
        notifications.show({
          title: 'CSV Statement Parsed',
          message: `Extracted ${result.transactions.length} transactions successfully.`,
          color: 'teal',
        });
      } else {
        throw new Error('Unsupported file format. Please upload a PDF, Excel (.xlsx/.xls), or CSV file.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse statement. Please ensure it is a valid M-Pesa statement.');
      notifications.show({
        title: 'Parsing Error',
        message: err.message || 'Could not parse statement.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = () => {
    setLoading(true);
    setTimeout(() => {
      const demo = getSampleMpesaTransactions();
      onDataLoaded(demo);
      notifications.show({
        title: 'Demo Statement Loaded',
        message: 'Loaded realistic M-Pesa 3-month statement with 32 transactions.',
        color: 'blue',
      });
      setLoading(false);
    }, 300);
  };

  return (
    <Paper withBorder p="xl" radius="md" pos="relative" shadow="sm">
      <LoadingOverlay visible={loading} overlayProps={{ radius: 'md', blur: 2 }} />

      <Stack gap="md">
        <Dropzone
          onDrop={handleDrop}
          onReject={() => setError('Invalid file format. Please upload PDF, Excel, or CSV.')}
          maxSize={10 * 1024 ** 2}
          accept={[
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
          ]}
          radius="md"
          p="xl"
        >
          <Group justify="center" gap="xl" mih={180} style={{ pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <IconUpload
                style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFileSpreadsheet
                style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}
                stroke={1.5}
              />
            </Dropzone.Idle>

            <div>
              <Text size="xl" inline fw={700}>
                Drag & Drop your M-Pesa Statement here
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Supports official PDF statements (with password support), Excel (.xlsx), and CSV files up to 10MB
              </Text>
              <Group gap="xs" mt={10}>
                <IconShieldLock size={16} color="var(--mantine-color-green-6)" />
                <Text size="xs" c="green.7" fw={600}>
                  100% Client-Side Privacy: Statement never leaves your browser
                </Text>
              </Group>
            </div>
          </Group>
        </Dropzone>

        {error && (
          <Alert color="red" title="Error" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Group justify="space-between" align="center" mt="xs">
          <Text size="xs" c="dimmed">
            Don't have an M-Pesa statement ready?
          </Text>
          <Button
            variant="light"
            color="teal"
            size="sm"
            leftSection={<IconSparkles size={16} />}
            onClick={handleLoadDemo}
          >
            Load Realistic Demo Statement
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};
