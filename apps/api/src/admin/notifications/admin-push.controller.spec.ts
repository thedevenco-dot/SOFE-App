import { AdminPushController } from './admin-push.controller';
import { NotificationsService } from '../../notifications/notifications.service';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';

describe('AdminPushController (Task T3.10)', () => {
  let controller: AdminPushController;

  const mockService = {
    listCampaigns: jest.fn(),
    createCampaign: jest.fn(),
    sendTestPush: jest.fn(),
    dispatchCampaign: jest.fn(),
  };

  const mockAdmin = {
    _id: { toString: () => 'admin_123' },
  } as unknown as AdminUserDocument;

  beforeEach(() => {
    controller = new AdminPushController(mockService as unknown as NotificationsService);
  });

  it('lists campaigns', async () => {
    mockService.listCampaigns.mockResolvedValue({ items: [], total: 0 });
    const res = await controller.listCampaigns(1, 20);
    expect(mockService.listCampaigns).toHaveBeenCalledWith(1, 20);
    expect(res.total).toBe(0);
  });

  it('creates push campaign', async () => {
    mockService.createCampaign.mockResolvedValue({ id: 'camp_1', title: 'Hello' });
    const res = await controller.createCampaign(mockAdmin, {
      title: 'Hello',
      body: 'World',
      segment: { type: 'all' },
    });
    expect(mockService.createCampaign).toHaveBeenCalledWith('admin_123', expect.any(Object));
    expect(res.data.id).toBe('camp_1');
  });

  it('sends test push', async () => {
    mockService.sendTestPush.mockResolvedValue({ success: true, sent: 1, failed: 0 });
    const res = await controller.sendTestPush(mockAdmin, {
      token: 'ExponentPushToken[abc1234567890]',
      title: 'Test',
      body: 'Body',
    });
    expect(mockService.sendTestPush).toHaveBeenCalledWith(
      'admin_123',
      'ExponentPushToken[abc1234567890]',
      { title: 'Test', body: 'Body', deepLink: undefined },
    );
    expect(res.success).toBe(true);
  });

  it('dispatches campaign', async () => {
    mockService.dispatchCampaign.mockResolvedValue({ id: 'camp_1', status: 'sent' });
    const res = await controller.dispatchCampaign('camp_1');
    expect(mockService.dispatchCampaign).toHaveBeenCalledWith('camp_1');
    expect(res.data.status).toBe('sent');
  });
});
