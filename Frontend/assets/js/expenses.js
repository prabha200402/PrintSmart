// PrintSmart - Expense Management (Complete Version)

let expenses = [];
let notifications = [];

// DOM Elements
const searchExpenseInput = document.getElementById('searchExpenseInput');
const notificationDot = document.getElementById('notificationDot');
const generateReportBtn = document.getElementById('generateReportBtn');
const expenseTableBody = document.getElementById('expenseTableBody');

// Load expenses from backend
async function loadExpenses() {
    try {
        const response = await fetch('../Backend/api/expenses.php');
        expenses = await response.json();
        renderExpenseTable();
        checkLowStockNotifications();
    } catch (error) {
        console.error('Error loading expenses:', error);
        showAlert('Failed to load expenses', 'error');
    }
}

// Render expense table with search filter
function renderExpenseTable() {
    if (!expenseTableBody) return;
    
    const searchTerm = searchExpenseInput ? searchExpenseInput.value.toLowerCase() : '';
    const filtered = expenses.filter(exp => 
        exp.category.toLowerCase().includes(searchTerm) ||
        exp.status.toLowerCase().includes(searchTerm) ||
        exp.id.toString().includes(searchTerm)
    );
    
    expenseTableBody.innerHTML = '';
    filtered.forEach(exp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${exp.id}</td>
            <td>${exp.category}</td>
            <td>LKR ${parseFloat(exp.amount).toLocaleString()}</td>
            <td>${exp.date}</td>
            <td><span class="status-badge status-${exp.status.toLowerCase()}">${exp.status}</span></td>
            <td>
                <button class="action-btn edit-btn" onclick="editExpense(${exp.id})">✏️</button>
                <button class="action-btn delete-btn" onclick="deleteExpense(${exp.id})">🗑️</button>
            </td>
        `;
        expenseTableBody.appendChild(row);
    });
}

// Search event listener
if (searchExpenseInput) {
    searchExpenseInput.addEventListener('input', renderExpenseTable);
}

// Check for low stock / high expenses notifications
function checkLowStockNotifications() {
    const highExpenses = expenses.filter(exp => exp.amount > 50000);
    notifications = highExpenses.map(exp => ({
        message: `⚠️ High expense: ${exp.category} - LKR ${exp.amount}`,
        type: 'warning'
    }));
    
    if (notificationDot) {
        notificationDot.style.display = notifications.length > 0 ? 'inline-block' : 'none';
    }
}

// Show notification alert
function showNotifications() {
    if (notifications.length === 0) {
        alert('No new notifications');
    } else {
        alert(notifications.map(n => n.message).join('\n'));
    }
}

// Notification button click
const btnNotifications = document.getElementById('btnNotifications');
if (btnNotifications) {
    btnNotifications.addEventListener('click', showNotifications);
}

// Edit expense
async function editExpense(id) {
    const expense = expenses.find(e => e.id == id);
    if (!expense) return;
    
    const newAmount = prompt('Edit amount:', expense.amount);
    const newStatus = prompt('Edit status (Pending/Approved/Rejected):', expense.status);
    
    if (newAmount && newStatus) {
        try {
            await fetch(`../Backend/api/expenses.php?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: newAmount, status: newStatus })
            });
            loadExpenses();
            showAlert('Expense updated!', 'success');
        } catch (error) {
            showAlert('Update failed', 'error');
        }
    }
}

// Delete expense
async function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        try {
            await fetch(`../Backend/api/expenses.php?id=${id}`, { method: 'DELETE' });
            loadExpenses();
            showAlert('Expense deleted!', 'success');
        } catch (error) {
            showAlert('Delete failed', 'error');
        }
    }
}

// ✅ COMPLETE PDF REPORT GENERATION
if (generateReportBtn) {
    generateReportBtn.addEventListener('click', async () => {
        // Check if jspdf is loaded
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library is loading. Please wait a moment and try again.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(0, 51, 102);
        doc.text("PrintSmart - Expense Report", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        
        // Search filter for report
        const searchTerm = searchExpenseInput ? searchExpenseInput.value.toLowerCase() : '';
        const filteredExpenses = expenses.filter(exp => 
            exp.category.toLowerCase().includes(searchTerm) ||
            exp.status.toLowerCase().includes(searchTerm) ||
            exp.id.toString().includes(searchTerm)
        );
        
        // Table headers
        const headers = [["ID", "Category", "Amount (LKR)", "Date", "Status"]];
        const rows = filteredExpenses.map(exp => [
            exp.id,
            exp.category,
            exp.amount,
            exp.date,
            exp.status
        ]);
        
        // Add table to PDF
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 40,
            theme: 'striped',
            headStyles: { fillColor: [0, 51, 102], textColor: 255 },
            alternateRowStyles: { fillColor: [240, 240, 240] }
        });
        
        // Footer with total
        const total = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total Expenses: LKR ${total.toLocaleString()}`, 14, finalY);
        
        // Save PDF
        doc.save(`PrintSmart_Expense_Report_${new Date().toISOString().slice(0,19)}.pdf`);
        
        // Optional: show success message
        showAlert('Report downloaded successfully!', 'success');
    });
}

// Helper function for alerts
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert ${type}`;
    alertDiv.innerText = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

// Initialize
loadExpenses();