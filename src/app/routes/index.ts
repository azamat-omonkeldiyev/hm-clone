import { Router } from 'express';
import propertyRoutes from '../modules/property/property.routes';
import adminRoutes from '../modules/user/user.routes';
import authRoutes from '../modules/auth/auth.routes';
import appointmentRoutes from '../modules/appointment/appointment.routes';
import favoritesRoutes from '../modules/favourite/favorite.route';
import messageRoutes from '../modules/message/message.routes';
import conversationRoutes from '../modules/conversation/conversation.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import dashboardStatsRoutes from '../modules/stats/stats.routes';
import ticketRoutes from '../modules/supportTicket/ticket.routes';
import inquiriesRoutes from '../modules/inquiry/inquiry.router';
import paymentRoutes from '../modules/payment/payment.router';
import tourRoutes from '../modules/tour/tour.routes';
import TestAuthRoutes from '../modules/auth/test.auth.routes';

const router = Router();

const moduleRoutes = [
    { path: '/properties', route: propertyRoutes },
    { path: '/admin', route: adminRoutes },
    { path: '/auth', route: authRoutes },
    { path: '/appointments', route: appointmentRoutes },
    { path: '/favorites', route: favoritesRoutes },
    { path: '/messages', route: messageRoutes },
    { path: '/conversations', route: conversationRoutes },
    { path: '/notifications', route: notificationRoutes },
    { path: '/tickets', route: ticketRoutes },
    { path: '/stats', route: dashboardStatsRoutes },
    { path: '/inquiries', route: inquiriesRoutes },
    { path: '/payments', route: paymentRoutes },
    { path: '/tour', route: tourRoutes },
    { path: '/test-auth', route: TestAuthRoutes },
];

moduleRoutes.forEach(({ path, route }) => {
    router.use(path, route);
});

export default router;
