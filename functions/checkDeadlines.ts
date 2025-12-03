import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { format, addHours, addDays, addWeeks, isBefore, parseISO } from 'npm:date-fns';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const preferences = user.preferences || {};
        
        // If alerts are disabled, exit
        if (!preferences.deadline_alerts && !preferences.task_reminders) {
            return Response.json({ message: 'Alerts disabled' });
        }

        // Determine lookahead window based on preferences
        const timing = preferences.alert_timing || '24h';
        const now = new Date();
        let lookaheadDate = new Date();

        switch(timing) {
            case '1h': lookaheadDate = addHours(now, 1); break;
            case '48h': lookaheadDate = addDays(now, 2); break;
            case '1w': lookaheadDate = addWeeks(now, 1); break;
            case '24h': 
            default: lookaheadDate = addDays(now, 1); break;
        }

        // Determine min priority
        const priorityLevels = { low: 1, medium: 2, high: 3, urgent: 4 };
        const minPriorityLevel = priorityLevels[preferences.min_priority || 'medium'] || 2;

        // Fetch Tasks and Events
        const tasks = await base44.entities.Task.filter({ 
            status: { $in: ['pending', 'in_progress'] },
            assigned_to: user.email 
        });
        
        const events = await base44.entities.CalendarEvent.filter({
            status: 'scheduled'
        }); // Filter by attendee logic might be needed if sharing exists, but sticking to simple owner/visibility for now

        const notifications = [];
        const email promises = [];

        // Check Tasks
        for (const task of tasks) {
            if (!task.due_date) continue;
            const dueDate = parseISO(task.due_date);
            
            // Check if due within window and not in past (with some buffer)
            if (isBefore(dueDate, lookaheadDate) && isBefore(now, dueDate)) {
                // Check priority
                const taskPriorityLevel = priorityLevels[task.priority || 'medium'] || 2;
                if (taskPriorityLevel < minPriorityLevel) continue;

                // Check if already notified recently (this is a simplified check, 
                // ideally we'd store a 'notified_at' timestamp on the task, but checking existing notifications works for daily checks)
                // We'll check if a notification for this task exists created today
                const existingNotif = await base44.entities.Notification.filter({
                    entity_id: task.id,
                    type: 'deadline',
                    created_date: { $gte: new Date(now.setHours(0,0,0,0)).toISOString() }
                });

                if (existingNotif.length === 0) {
                    // Create Notification
                    const notifData = {
                        type: 'deadline',
                        title: `Prazo Próximo: ${task.title}`,
                        message: `A tarefa "${task.title}" vence em breve (${format(dueDate, 'dd/MM/yyyy')}).`,
                        recipient_email: user.email,
                        entity_type: 'task',
                        entity_id: task.id,
                        is_read: false
                    };
                    await base44.entities.Notification.create(notifData);
                    notifications.push(notifData);

                    // Send Email
                    if (preferences.email_notifications) {
                         await base44.integrations.Core.SendEmail({
                            to: user.email,
                            subject: `Lembrete de Prazo: ${task.title}`,
                            body: `Olá ${user.full_name},\n\nEste é um lembrete de que a tarefa "${task.title}" vence em ${format(dueDate, 'dd/MM/yyyy')}.\n\nPrioridade: ${task.priority}\n\nAcesse o sistema para mais detalhes.`
                        });
                    }
                }
            }
        }

        // Check Events
        for (const event of events) {
            if (!event.start_time) continue;
            const startDate = parseISO(event.start_time);
            
            if (isBefore(startDate, lookaheadDate) && isBefore(now, startDate)) {
                const eventPriorityLevel = priorityLevels[event.priority || 'medium'] || 2;
                if (eventPriorityLevel < minPriorityLevel) continue;

                 const existingNotif = await base44.entities.Notification.filter({
                    entity_id: event.id,
                    type: 'deadline',
                    created_date: { $gte: new Date(now.setHours(0,0,0,0)).toISOString() }
                });

                if (existingNotif.length === 0) {
                    const notifData = {
                        type: 'deadline',
                        title: `Evento Próximo: ${event.title}`,
                        message: `O evento "${event.title}" começa em breve (${format(startDate, 'HH:mm dd/MM')}).`,
                        recipient_email: user.email,
                        entity_type: 'event',
                        entity_id: event.id,
                        is_read: false
                    };
                    await base44.entities.Notification.create(notifData);
                    notifications.push(notifData);

                    if (preferences.email_notifications) {
                        await base44.integrations.Core.SendEmail({
                            to: user.email,
                            subject: `Lembrete de Evento: ${event.title}`,
                            body: `Olá ${user.full_name},\n\nLembrete para o evento "${event.title}" marcado para ${format(startDate, 'dd/MM/yyyy às HH:mm')}.\n\nLocal: ${event.location || 'N/A'}\n\nAcesse o sistema para mais detalhes.`
                        });
                    }
                }
            }
        }

        return Response.json({ processed: true, notifications_sent: notifications.length });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});