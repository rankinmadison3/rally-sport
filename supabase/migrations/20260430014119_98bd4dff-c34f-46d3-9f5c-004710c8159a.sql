CREATE POLICY "Sender can read receipts on own messages"
  ON public.chat_message_reads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      WHERE m.id = chat_message_reads.message_id
        AND m.sender_id = auth.uid()
    )
  );