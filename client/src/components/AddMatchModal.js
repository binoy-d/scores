import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { publicAPI, matchesAPI } from '../services/api';
import { Modal, Form, Select, Input, Button, message } from 'antd';
import { UserOutlined, TrophyOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const AddMatchModal = ({ isOpen, onClose }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch all players for the dropdown
  const { data: playersResponse, isLoading, error } = useQuery(
    'players-for-match',
    () => publicAPI.getPlayers({ limit: 100 }), // Get all players for selection
    { 
      enabled: isOpen
    }
  );

  // Extract players array from the API response structure
  const players = playersResponse?.data?.players || [];

  // Debug logging
  React.useEffect(() => {
    if (isOpen) {
      console.log('AddMatchModal opened');
      console.log('Players response:', playersResponse);
      console.log('Players array:', players);
      console.log('Is loading:', isLoading);
      console.log('Error:', error);
    }
  }, [isOpen, playersResponse, players, isLoading, error]);

  // Mutation to create match
  const createMatchMutation = useMutation(
    (matchData) => matchesAPI.create(matchData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('public-leaderboard');
        queryClient.invalidateQueries('pending-requests');
        message.success('Match added successfully!');
        handleClose();
      },
      onError: (error) => {
        console.error('Failed to create match:', error);
        message.error('Failed to create match. Please try again.');
        setIsSubmitting(false);
      }
    }
  );

  const handleClose = () => {
    if (!isSubmitting) {
      form.resetFields();
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleSubmit = async (values) => {
    const { winner, loser, notes } = values;
    
    if (winner === loser) {
      message.error('Winner and loser must be different players');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createMatchMutation.mutateAsync({
        winner_id: parseInt(winner),
        loser_id: parseInt(loser),
        notes: notes?.trim() || undefined
      });
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <span style={{ color: '#9333ea', fontSize: '20px', fontWeight: 'bold' }}>
          <TrophyOutlined style={{ marginRight: 8 }} />
          Add Match Result
        </span>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 24 }}
      >
        <Form.Item
          name="winner"
          label={
            <span style={{ fontWeight: 'bold' }}>
              <TrophyOutlined style={{ marginRight: 4, color: '#f59e0b' }} />
              Winner
            </span>
          }
          rules={[{ required: true, message: 'Please select the winner!' }]}
        >
          <Select
            placeholder={isLoading ? 'Loading players...' : 'Select winner...'}
            loading={isLoading}
            disabled={isSubmitting}
            size="large"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {players.map((player) => (
              <Option key={player.id} value={player.id}>
                <UserOutlined style={{ marginRight: 8 }} />
                {player.username} (ELO: {player.elo_rating})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="loser"
          label={
            <span style={{ fontWeight: 'bold' }}>
              <UserOutlined style={{ marginRight: 4, color: '#6b7280' }} />
              Loser
            </span>
          }
          rules={[{ required: true, message: 'Please select the loser!' }]}
        >
          <Select
            placeholder={isLoading ? 'Loading players...' : 'Select loser...'}
            loading={isLoading}
            disabled={isSubmitting}
            size="large"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {players.map((player) => (
              <Option key={player.id} value={player.id}>
                <UserOutlined style={{ marginRight: 8 }} />
                {player.username} (ELO: {player.elo_rating})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="notes"
          label={<span style={{ fontWeight: 'bold' }}>Notes (optional)</span>}
        >
          <TextArea
            rows={3}
            placeholder="Add any notes about the match..."
            disabled={isSubmitting}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button
              size="large"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isSubmitting}
              disabled={isLoading}
              style={{ backgroundColor: '#9333ea', borderColor: '#9333ea' }}
            >
              {isSubmitting ? 'Adding Match...' : 'Add Match'}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddMatchModal;
