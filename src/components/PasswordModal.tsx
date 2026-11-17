import React, { useState } from 'react';
import { Modal, PasswordInput, Button, Text, Stack, Alert, Group, Code } from '@mantine/core';
import { IconLock, IconShieldCheck, IconInfoCircle } from '@tabler/icons-react';
import { parseMpesaPdf, ParseResult, InvalidPasswordError, PasswordRequiredError } from '../utils/parser';

interface PasswordModalProps {
  opened: boolean;
  file: File | null;
  fileBuffer: ArrayBuffer | null;
  onClose: () => void;
  onSuccess: (result: ParseResult) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  opened,
  file,
  fileBuffer,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    const trimmed = password.trim();
    if (!trimmed) {
      setError('Please enter the password or code sent by Safaricom.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Obtain a guaranteed fresh, non-detached ArrayBuffer
      let buffer: ArrayBuffer;
      if (file) {
        buffer = await file.arrayBuffer();
      } else if (fileBuffer) {
        buffer = fileBuffer.slice(0);
      } else {
        setError('No statement file loaded. Please drop your statement file again.');
        return;
      }

      const result = await parseMpesaPdf(buffer, trimmed);
      onSuccess(result);
      setPassword('');
      onClose();
    } catch (err: any) {
      console.error('PDF decryption error:', err);
      if (
        err instanceof InvalidPasswordError ||
        err.name === 'PasswordException' ||
        err.code === 2 ||
        err.message?.includes('password')
      ) {
        setError(
          'Incorrect password. Please verify the code Safaricom sent to you via SMS (e.g. 3215M) or try your National ID / Passport number.'
        );
      } else if (err instanceof PasswordRequiredError) {
        setError('A password is required to decrypt this statement.');
      } else {
        setError(`Decryption failed: ${err.message || 'Unknown error. Please check the code.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        setPassword('');
        setError(null);
        onClose();
      }}
      title={<Text fw={700}>Encrypted Statement Detected</Text>}
      centered
      radius="md"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Safaricom encrypts M-Pesa PDF statements with the <strong>password or alphanumeric code</strong> sent to you via SMS (e.g. <Code>3215M</Code>) or your <strong>National ID / Passport number</strong>.
        </Text>

        <Group gap="xs">
          <IconShieldCheck size={18} color="var(--mantine-color-teal-6)" />
          <Text size="xs" c="teal.7" fw={500}>
            Decrypted 100% locally on your machine. Your code is never sent anywhere.
          </Text>
        </Group>

        <PasswordInput
          label="Safaricom Password / Code"
          description="Enter the exact code that unlocked the file in your browser"
          placeholder="e.g. 3215M or National ID"
          leftSection={<IconLock size={16} />}
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUnlock();
          }}
          error={!!error}
          autoFocus
        />

        {error && (
          <Alert color="red" icon={<IconInfoCircle size={16} />}>
            {error}
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="teal" onClick={handleUnlock} loading={loading}>
            Unlock & Analyze
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
