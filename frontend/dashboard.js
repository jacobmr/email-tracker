// Dashboard API endpoints and functionality
class EmailTrackerDashboard {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        this.loadStats();
        this.loadRecentEmails();
        this.setupEventListeners();
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
            const stats = await response.json();
            
            document.getElementById('total-emails').textContent = stats.total;
            document.getElementById('opened-emails').textContent = stats.opened;
            document.getElementById('not-opened-emails').textContent = stats.notOpened;
            document.getElementById('open-rate').textContent = `${stats.openRate}%`;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadRecentEmails() {
        try {
            const response = await fetch(`${this.apiBase}/emails/recent`);
            const emails = await response.json();
            
            this.renderEmails(emails);
        } catch (error) {
            console.error('Error loading emails:', error);
        }
    }

    renderEmails(emails) {
        const tbody = document.getElementById('email-list');
        if (!emails || emails.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No emails sent yet</td></tr>';
            return;
        }

        tbody.innerHTML = emails.map(email => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div class="truncate max-w-xs">${email.subject}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${email.recipient}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(email.sentAt).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        email.opened ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                        ${email.opened ? 'Opened' : 'Not Opened'}
                    </span>
                    ${email.openedAt ? `<br><small class="text-gray-500">${new Date(email.openedAt).toLocaleString()}</small>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-900" onclick="dashboard.viewDetails('${email.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-green-600 hover:text-green-900" onclick="dashboard.viewTracking('${email.id}')" title="View Tracking">
                            <i class="fas fa-chart-line"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async viewDetails(emailId) {
        try {
            const response = await fetch(`${this.apiBase}/emails/${emailId}`);
            const email = await response.json();
            
            // Show modal with email details
            this.showEmailDetails(email);
        } catch (error) {
            console.error('Error loading email details:', error);
        }
    }

    async viewTracking(emailId) {
        try {
            const response = await fetch(`${this.apiBase}/emails/${emailId}/tracking`);
            const tracking = await response.json();
            
            // Show modal with tracking details
            this.showTrackingDetails(tracking);
        } catch (error) {
            console.error('Error loading tracking details:', error);
        }
    }

    showEmailDetails(email) {
        // Create and show modal with email details
        const modal = this.createModal('Email Details', `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Subject</label>
                    <p class="mt-1 text-sm text-gray-900">${email.subject}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Recipient</label>
                    <p class="mt-1 text-sm text-gray-900">${email.recipient}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Sent</label>
                    <p class="mt-1 text-sm text-gray-900">${new Date(email.sentAt).toLocaleString()}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <p class="mt-1 text-sm text-gray-900">${email.opened ? 'Opened' : 'Not Opened'}</p>
                </div>
                ${email.openedAt ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Opened At</label>
                        <p class="mt-1 text-sm text-gray-900">${new Date(email.openedAt).toLocaleString()}</p>
                    </div>
                ` : ''}
                ${email.userAgent ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700">User Agent</label>
                        <p class="mt-1 text-sm text-gray-900">${email.userAgent}</p>
                    </div>
                ` : ''}
            </div>
        `);
        
        document.body.appendChild(modal);
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">${title}</h3>
                        <div class="mt-2">${content}</div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm" onclick="this.parentElement.parentElement.parentElement.remove()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refresh-btn')?.addEventListener('click', () => {
            this.loadStats();
            this.loadRecentEmails();
        });
    }
}

// Initialize dashboard
const dashboard = new EmailTrackerDashboard();

// Export for use in other files
window.dashboard = dashboard;
