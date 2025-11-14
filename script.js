(function() {
    "use strict";

    // --- START: FLUTTER BRIDGE CODE ---

    /**
     * This is the "receiver" function.
     * Flutter will call this with the Base64 image data from 
     * EITHER the camera OR the gallery.
     */
    window.flutterImageReceiver = function(data) {
        console.log("Image data received from Flutter.");
        try {
            const imageFile = base64ToFile(
                data.base64,
                'native_capture.jpg',
                data.mimeType
            );
            handleImageUpload(imageFile);
        } catch (e) {
            console.error("Error processing image data from Flutter:", e);
        }
    }

    /** Helper function to convert a Base64 string into a File. */
    function base64ToFile(base64, filename, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
            type: mimeType
        });
        return new File([blob], filename, {
            type: mimeType
        });
    }

    /** Checks if we are running in the Flutter "Smart Frame". */
    function isRunningInApp() {
        return window.flutter_inappwebview &&
            window.flutter_inappwebview.callHandler;
    }

    /** Sends the "openCamera" message to Flutter. */
    function scanWithNativeCamera() {
        if (isRunningInApp()) {
            console.log("Sending 'openCamera' message to Flutter...");
            window.flutter_inappwebview.callHandler('openCamera');
        } else {
            startCamera();
        }
    }

    /** Sends the "openGallery" message to Flutter. */
    function scanWithNativeGallery() {
        if (isRunningInApp()) {
            console.log("Sending 'openGallery' message to Flutter...");
            window.flutter_inappwebview.callHandler('openGallery');
        } else {
            document.getElementById('receiptUploader').click();
        }
    }
    // --- END: FLUTTER BRIDGE ---


    // --- DOM Elements ---
    const loadingSpinner = document.getElementById('loading-spinner');
    const welcomeScreen = document.getElementById('welcome-screen');
    const monthsScreen = document.getElementById('months-screen');
    const appScreen = document.getElementById('app-screen');

    const welcomeBtn = document.getElementById('welcome-btn');
    const jumpToMonthForm = document.getElementById('jump-to-month-form');
    const jumpToMonthInput = document.getElementById('jump-to-month-input');
    const monthFoldersList = document.getElementById('month-folders-list');

    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');

    const backToMonthsBtn = document.getElementById('back-to-months-btn');
    const monthSelector = document.getElementById('month-selector');

    const totalBudgetEl = document.getElementById('total-budget');
    const totalSpentEl = document.getElementById('total-spent');
    const remainingBudgetEl = document.getElementById('remaining-budget');

    const budgetForm = document.getElementById('budget-form');
    const budgetNameInput = document.getElementById('budget-name');
    const budgetAmountInput = document.getElementById('budget-amount');
    const budgetTypeSelect = document.getElementById('budget-type');
    const budgetListEl = document.getElementById('budget-list');

    const setCategoryLimitsBtn = document.getElementById('set-category-limits-btn');
    const categoryLimitsModal = document.getElementById('category-limits-modal');
    const closeLimitsModalBtn = document.getElementById('close-limits-modal-btn');
    const categoryLimitsFormContainer = document.getElementById('category-limits-form-container');
    const saveLimitsBtn = document.getElementById('save-limits-btn');
    const limitExceededList = document.getElementById('limit-exceeded-list');

    const expenseForm = document.getElementById('expense-form');
    const expenseNameInput = document.getElementById('expense-name');
    const expenseAmountInput = document.getElementById('expense-amount');
    const expenseCategorySelect = document.getElementById('expense-category');
    const expenseDateInput = document.getElementById('expense-date');
    const expenseHourInput = document.getElementById('expense-hour');
    const expenseMinuteInput = document.getElementById('expense-minute');
    const expenseAmpmInput = document.getElementById('expense-ampm');

    const upcomingExpensesListEl = document.getElementById('upcoming-expenses-list');
    const paidExpensesListEl = document.getElementById('paid-expenses-list');
    const noUpcomingEl = document.getElementById('no-upcoming');
    const noPaidEl = document.getElementById('no-paid');

    const chartTitleEl = document.getElementById('chart-title');

    const notesForm = document.getElementById('notes-form');
    const noteInput = document.getElementById('note-input');
    const notesListEl = document.getElementById('notes-list');
    const noNotesEl = document.getElementById('no-notes');

    const notificationContainer = document.getElementById('notification-container');

    const receiptUploader = document.getElementById('receiptUploader');
    const openCameraButton = document.getElementById('openCameraButton');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const scanLoader = document.getElementById('scanLoader');
    const scanResult = document.getElementById('scanResult');
    const scanError = document.getElementById('scanError');

    const analyzeButton = document.getElementById('analyzeButton');
    const analyzeLoader = document.getElementById('analyzeLoader');
    const analysisResult = document.getElementById('analysisResult');
    const analyzeError = document.getElementById('analyzeError');

    const cameraModal = document.getElementById('camera-modal');
    const cameraFeed = document.getElementById('camera-feed');
    const captureBtn = document.getElementById('capture-btn');
    const closeCameraModalBtn = document.getElementById('close-camera-modal-btn');
    const captureCanvas = document.getElementById('capture-canvas');
    const uploadLabel = document.getElementById('uploadLabel');


    // --- State Variables ---
    let currentMonth = '';
    let currentBudgets = [];
    let currentExpenses = [];
    let currentNotes = [];
    let currentCategoryLimits = {};
    let expenseChart = null;
    let cameraStream = null;

    const CATEGORIES = [
        'Food & Groceries', 'Transport', 'Bills', 'Rent', 'Shopping',
        'Entertainment', 'Health', 'Education', 'Subscriptions',
        'Electronics and Gadget', 'Sports & Fitness', 'Hangouts', 'Other'
    ];

    // --- Data Functions (LocalStorage) ---
    const getDbKey = (key, month) => `spendcount-${key}-${month}`;
    const getGlobalDbKey = (key) => `spendcount-global-${key}`;
    const loadBudgets = (month) => JSON.parse(localStorage.getItem(getDbKey('budgets', month))) || [];
    const saveBudgets = (month, budgets) => localStorage.setItem(getDbKey('budgets', month), JSON.stringify(budgets));
    const loadExpenses = (month) => JSON.parse(localStorage.getItem(getDbKey('expenses', month))) || [];
    const saveExpenses = (month, expenses) => localStorage.setItem(getDbKey('expenses', month), JSON.stringify(expenses));
    const loadNotes = (month) => JSON.parse(localStorage.getItem(getDbKey('notes', month))) || [];
    const saveNotes = (month, notes) => localStorage.setItem(getDbKey('notes', month), JSON.stringify(notes));
    const loadCategoryLimits = (month) => JSON.parse(localStorage.getItem(getDbKey('limits', month))) || {};
    const saveCategoryLimits = (month, limits) => localStorage.setItem(getDbKey('limits', month), JSON.stringify(limits));
    const loadRepeatedExpensesApplied = () => JSON.parse(localStorage.getItem(getGlobalDbKey('repeatedExpensesApplied'))) || {};
    const saveRepeatedExpensesApplied = (applied) => localStorage.setItem(getGlobalDbKey('repeatedExpensesApplied'), JSON.stringify(applied));
    const loadAllMonthKeys = () => {
        const keys = Object.keys(localStorage);
        const monthKeys = new Set();
        keys.forEach(key => {
            if (key.startsWith('spendcount-expenses-')) {
                monthKeys.add(key.replace('spendcount-expenses-', ''));
            }
            if (key.startsWith('spendcount-budgets-')) {
                monthKeys.add(key.replace('spendcount-budgets-', ''));
            }
            if (key.startsWith('spendcount-notes-')) {
                monthKeys.add(key.replace('spendcount-notes-', ''));
            }
            if (key.startsWith('spendcount-limits-')) {
                monthKeys.add(key.replace('spendcount-limits-', ''));
            }
        });
        return Array.from(monthKeys).sort().reverse();
    };

    // --- Core App Logic ---
    function loadMonthData(yearMonth) {
        const appliedMonths = loadRepeatedExpensesApplied();

        currentMonth = yearMonth;
        localStorage.setItem('currentMonth', yearMonth);
        monthSelector.value = yearMonth;

        currentBudgets = loadBudgets(yearMonth);
        currentExpenses = loadExpenses(yearMonth);
        currentNotes = loadNotes(yearMonth);
        currentCategoryLimits = loadCategoryLimits(yearMonth);
        const expensesExist = localStorage.getItem(getDbKey('expenses', yearMonth));
        const budgetsExist = localStorage.getItem(getDbKey('budgets', yearMonth));
        const notesExist = localStorage.getItem(getDbKey('notes', yearMonth));
        const limitsExist = localStorage.getItem(getDbKey('limits', yearMonth));
        if (!expensesExist && !budgetsExist && !notesExist && !limitsExist) {
            saveExpenses(yearMonth, []);
        }

        renderRepeatedExpensesList();

        // NOTE: The autoAdd logic below is removed as per the user's request,
        // but the core function is kept clean. The original autoAdd logic
        // is removed because the feature was removed.
        // The loadRepeatedExpenses() call is also removed here.

        updateAllDisplays();
        chartTitleEl.textContent = `Category Spending for ${new Date(yearMonth + '-02').toLocaleDateString([], { month: 'long', year: 'numeric' })}`;
    }

    // --- Rendering & Update Functions ---
    function updateAllDisplays() {
        renderBudgetList();
        renderExpenseLists();
        renderNotesList();
        updateSummary();
        updateChart();
        checkCategoryLimits();
    }
    function updateSummary() {
        const totalBudget = currentBudgets.reduce((sum, b) => sum + b.amount, 0);
        const paidExpenses = currentExpenses.filter(e => e.paid);
        const totalSpent = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
        const remainingBudget = totalBudget - totalSpent;
        totalBudgetEl.textContent = `₹${totalBudget.toFixed(2)}`;
        totalSpentEl.textContent = `₹${totalSpent.toFixed(2)}`;
        remainingBudgetEl.textContent = `₹${remainingBudget.toFixed(2)}`;

        remainingBudgetEl.classList.toggle('text-red-600', remainingBudget < 0);
        remainingBudgetEl.classList.toggle('text-green-600', remainingBudget >= 0);
    }
    function renderMonthFolders() {
        const months = loadAllMonthKeys();
        monthFoldersList.innerHTML = '';
        if (months.length === 0) {
            monthFoldersList.innerHTML = `<p class="text-gray-500 text-center col-span-full subtitle">No expense data found. Start by adding expenses for a month.</p>`;
            return;
        }

        months.forEach(month => {
            const monthDate = new Date(month + '-02');
            const monthName = monthDate.toLocaleDateString([], {
                month: 'long'
            });
            const year = monthDate.toLocaleDateString([], {
                year: 'numeric'
            });

            const card = document.createElement('div');
            card.className = 'card-style rounded-xl p-6 text-center cursor-pointer hover:shadow-lg transition-shadow duration-300 relative';

            card.innerHTML = `
                <button 
                    onclick="window.deleteMonthData(event, '${month}')" 
                    class="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 transition-colors z-10" 
                    title="Delete all data for ${monthName} ${year}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-amber-800 mb-3"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
                    <h3 class="text-2xl">${monthName}</h3>
                    <p class="text-gray-500 subtitle">${year}</p>
                `;
            card.addEventListener('click', () => {
                loadMonthData(month);
                showScreen('app');
            });
            monthFoldersList.appendChild(card);
        });
    }
    function renderBudgetList() {
        budgetListEl.innerHTML = '';
        if (currentBudgets.length === 0) {
            budgetListEl.innerHTML = `<p class="text-gray-500 text-center py-2 subtitle">No budget sources added.</p>`;
            return;
        }
        currentBudgets.forEach(budget => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-lg border';
            item.innerHTML = `
                <div>
                    <span class="font-bold text-gray-800">${budget.name}</span>
                    <span class="text-sm text-gray-500 ml-2 capitalize">(${budget.type})</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-bold text-blue-700">₹${budget.amount.toFixed(2)}</span>
                    <button onclick="deleteBudget('${budget.id}')" class="text-red-500 hover:text-red-700 p-1" title="Delete budget">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `;
            budgetListEl.appendChild(item);
        });
    }
    function renderExpenseLists() {
        upcomingExpensesListEl.innerHTML = '';
        paidExpensesListEl.innerHTML = '';

        const unpaid = currentExpenses.filter(e => !e.paid).sort((a, b) => new Date(a.date) - new Date(b.date));
        const paid = currentExpenses.filter(e => e.paid).sort((a, b) => new Date(b.date) - new Date(a.date));
        noUpcomingEl.classList.toggle('hidden', unpaid.length > 0);
        noPaidEl.classList.toggle('hidden', paid.length > 0);
        unpaid.forEach(expense => {
            upcomingExpensesListEl.appendChild(createExpenseItem(expense));
        });

        paid.forEach(expense => {
            paidExpensesListEl.appendChild(createExpenseItem(expense));
        });
    }
    function createExpenseItem(expense) {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-4 p-3 bg-gray-50 rounded-lg border';

        const displayDate = new Date(expense.date).toLocaleDateString([], {
            day: '2-digit',
            month: 'short'
        });
        const displayTime = formatTime(expense.hour, expense.minute, expense.ampm);

        item.innerHTML = `
            <div class="flex-shrink-0">
                <button onclick="markExpenseAsPaid('${expense.id}')" class="w-6 h-6 rounded-md border-2 ${expense.paid ? 'bg-green-600 border-green-600' : 'border-gray-400'} flex items-center justify-center transition-colors" title="${expense.paid ? 'Mark as Unpaid' : 'Mark as Paid'}">
                    ${expense.paid ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                </button>
            </div>
            <div class="flex-grow">
                <span class="font-bold text-gray-800">${expense.name}</span>
                <span class="text-sm text-gray-500 block">${expense.category} | ${displayDate} at ${displayTime}</span>
            </div>
            <div class="text-right">
                <span class="font-bold text-lg ${expense.paid ? 'text-gray-500 line-through' : 'text-red-600'}">₹${expense.amount.toFixed(2)}</span>
            </div>
            <button onclick="deleteExpense('${expense.id}')" class="text-red-500 hover:text-red-700 p-1 flex-shrink-0" title="Delete expense">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        `;
        return item;
    }
    function renderNotesList() {
        notesListEl.innerHTML = '';
        noNotesEl.classList.toggle('hidden', currentNotes.length > 0);

        currentNotes.forEach(note => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-start gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg';
            item.innerHTML = `
                <p class="text-gray-800 whitespace-pre-wrap flex-1">${note.text}</p>
                <button onclick="deleteNote('${note.id}')" class="text-red-500 hover:text-red-700 p-1 flex-shrink-0" title="Delete note">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            `;
            notesListEl.appendChild(item);
        });
    }
    function renderCategoryLimitForm() {
        categoryLimitsFormContainer.innerHTML = '';
        CATEGORIES.forEach(category => {
            const limit = currentCategoryLimits[category] || '';
            const item = document.createElement('div');
            item.className = 'grid grid-cols-3 gap-2 items-center';
            item.innerHTML = `
                <label for="limit-${category}" class="font-bold text-gray-700 col-span-1">${category}</label>
                <input type="number" id="limit-${category}" data-category="${category}" 
                       placeholder="No limit" value="${limit}" 
                       class="input-style col-span-2">
            `;
            categoryLimitsFormContainer.appendChild(item);
        });
    }
    function checkCategoryLimits() {
        limitExceededList.innerHTML = '';
        const paidExpenses = currentExpenses.filter(e => e.paid);
        const spendingByCategory = {};

        paidExpenses.forEach(expense => {
            spendingByCategory[expense.category] = (spendingByCategory[expense.category] || 0) + expense.amount;
        });

        let exceeded = false;
        for (const category in currentCategoryLimits) {
            const limit = currentCategoryLimits[category];
            const spent = spendingByCategory[category] || 0;
            if (limit > 0 && spent > limit) {
                exceeded = true;
                const item = document.createElement('div');
                item.className = 'p-3 bg-red-100 border border-red-300 rounded-lg text-red-800';
                item.innerHTML = `
                    <span class="font-bold">Warning:</span> You have exceeded your <b>${category}</b> limit!
                    <span class="block text-sm">Spent: ₹${spent.toFixed(2)} / Limit: ₹${limit.toFixed(2)}</span>
                `;
                limitExceededList.appendChild(item);
            }
        }

        if (!exceeded) {
            limitExceededList.innerHTML = `<p class="text-gray-500 text-center py-2 subtitle">All categories are within their limits.</p>`;
        }
    }

    // --- Charting ---
    function updateChart() {
        const paidExpenses = currentExpenses.filter(e => e.paid);
        const spendingByCategory = {};

        paidExpenses.forEach(expense => {
            spendingByCategory[expense.category] = (spendingByCategory[expense.category] || 0) + expense.amount;
        });

        const labels = Object.keys(spendingByCategory);
        const data = Object.values(spendingByCategory);

        const backgroundColors = [
            '#795548', '#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8',
            '#FF5722', '#FF7043', '#FF8A65', '#FFAB91', '#FFCCBC'
        ];

        const chartData = {
            labels: labels,
            datasets: [{
                label: 'Spending',
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        };
        if (expenseChart) {
            expenseChart.destroy();
        }
        const ctx = document.getElementById('expense-chart').getContext('2d');
        expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                family: "'Inter', sans-serif"
                            },
                            color: '#4E342E'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('en-IN', {
                                        style: 'currency',
                                        currency: 'INR'
                                    }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- Utility Functions ---
    function showNotification(message, type = 'success') {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-blue-600'
        };

        const notif = document.createElement('div');
        notif.className = `p-4 rounded-lg shadow-lg text-white ${colors[type]} transition-all duration-300 transform translate-x-full opacity-0`;
        notif.textContent = message;

        notificationContainer.appendChild(notif);

        setTimeout(() => {
            notif.classList.remove('translate-x-full', 'opacity-0');
            notif.classList.add('translate-x-0', 'opacity-100');
        }, 10);

        setTimeout(() => {
            notif.classList.add('opacity-0');
            setTimeout(() => {
                notif.remove();
            }, 300);
        }, 4000);
    }
    function populateCategorySelect(selectElement) {
        if (!selectElement) return;
        selectElement.innerHTML = '';
        CATEGORIES.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            selectElement.appendChild(option);
        });
    }
    function populateTimeSelects(hourEl, minuteEl, ampmEl, defaultDate = new Date()) {
        if (!hourEl || !minuteEl || !ampmEl) return;

        hourEl.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i.toString().padStart(2, '0');
            option.textContent = i.toString().padStart(2, '0');
            hourEl.appendChild(option);
        }

        minuteEl.innerHTML = '';
        for (let i = 0; i < 60; i += 5) {
            const option = document.createElement('option');
            option.value = i.toString().padStart(2, '0');
            option.textContent = i.toString().padStart(2, '0');
            minuteEl.appendChild(option);
        }

        let currentHour = defaultDate.getHours();
        const currentMinute = Math.floor(defaultDate.getMinutes() / 5) * 5;

        const ampm = currentHour >= 12 ? 'PM' : 'AM';
        currentHour = currentHour % 12;
        currentHour = currentHour ? currentHour : 12;

        hourEl.value = currentHour.toString().padStart(2, '0');
        minuteEl.value = currentMinute.toString().padStart(2, '0');
        ampmEl.value = ampm;
    }
    function formatTime(hour, minute, ampm) {
        return `${hour}:${minute} ${ampm}`;
    }

    // This is the function for Task 2 (Future Months)
    function autoAddRepeatedExpenses(yearMonth) {
        const monthDate = new Date(yearMonth + '-02');
        const monthName = monthDate.toLocaleDateString([], {
            month: 'long'
        });

        const monthStartDate = new Date(yearMonth + '-01T00:00:00');
        const monthEndDate = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 0);
        const daysInMonth = monthEndDate.getDate();

        let addedAny = false;
        currentUserRepeatedExpenses.forEach(repExpense => {
            if (repExpense.isPaused) {
                return;
            }
            let day = repExpense.day;
            if (day > daysInMonth) {
                day = daysInMonth;
            }

            const date = `${yearMonth}-${day.toString().padStart(2, '0')}`;

            const newExpense = {
                id: crypto.randomUUID(),
                name: repExpense.name,
                amount: repExpense.amount,
                category: repExpense.category,
                date: date,
                hour: repExpense.hour,
                minute: repExpense.minute,
                ampm: repExpense.ampm,
                paid: false,
                repeatedExpenseId: repExpense.id
            };

            const alreadyExists = currentExpenses.some(ex =>
                ex.repeatedExpenseId === newExpense.repeatedExpenseId && ex.date === newExpense.date
            );

            if (!alreadyExists) {
                currentExpenses.push(newExpense);
                addedAny = true;
            }
        });

        saveExpenses(currentMonth, currentExpenses);

        const appliedMonths = loadRepeatedExpensesApplied();
        appliedMonths[yearMonth] = true;
        saveRepeatedExpensesApplied(appliedMonths);

        if (addedAny) {
            showNotification(`Repeated expenses added to ${monthName}!`, 'success');
        }
    }

    // This is the helper function for Task 2 (Current Month)
    function addExpenseFromTemplate(repExpense) {
        if (!currentMonth) {
            showNotification('Please select a month first.', 'error');
            return;
        }
        const monthStartDate = new Date(currentMonth + '-01T00:00:00');
        const monthEndDate = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 0);
        const daysInMonth = monthEndDate.getDate();
        let day = repExpense.day;
        if (day > daysInMonth) {
            day = daysInMonth;
        }

        const date = `${currentMonth}-${day.toString().padStart(2, '0')}`;
        const alreadyExists = currentExpenses.some(ex =>
            ex.repeatedExpenseId === repExpense.id && ex.date === date
        );
        if (alreadyExists) {
            showNotification(`"${repExpense.name}" is already in this month's unpaid expenses!`, 'info');
            return;
        }
        const newExpense = {
            id: crypto.randomUUID(),
            name: repExpense.name,
            amount: repExpense.amount,
            category: repExpense.category,
            date: date,
            hour: repExpense.hour,
            minute: repExpense.minute,
            ampm: repExpense.ampm,
            paid: false,
            repeatedExpenseId: repExpense.id
        };
        currentExpenses.push(newExpense);
        saveExpenses(currentMonth, currentExpenses);

        showNotification(`"${repExpense.name}" added to this month's unpaid expenses!`, 'success');

        // We must update the UI after adding
        renderExpenseLists();
        updateSummary();
        updateChart();
        checkCategoryLimits();
    }

    // --- Global Window Functions ---
    window.deleteRepeatedExpense = (id) => {
        currentUserRepeatedExpenses = currentUserRepeatedExpenses.filter(e => e.id !== id);
        saveRepeatedExpenses(currentUserRepeatedExpenses);
        renderRepeatedExpensesList();
        showNotification('Repeated expense deleted.', 'success');
    };
    window.togglePauseRepeatedExpense = (id) => {
        const expense = currentUserRepeatedExpenses.find(e => e.id === id);
        if (expense) {
            expense.isPaused = !expense.isPaused;
            saveRepeatedExpenses(currentUserRepeatedExpenses);
            renderRepeatedExpensesList();
            showNotification(expense.isPaused ? `"${expense.name}" is now PAUSED.` : `"${expense.name}" is now ACTIVE.`, 'info');
        }
    };

    // --- THIS IS THE CORRECTED FUNCTION ---
    window.deleteMonthData = (event, month) => {
        event.stopPropagation();
        const monthDate = new Date(month + '-02');
        const monthName = monthDate.toLocaleDateString([], {
            month: 'long'
        });
        const year = monthDate.toLocaleDateString([], {
            year: 'numeric'
        });
        if (confirm(`Are you sure you want to permanently delete ALL data for ${monthName} ${year}? This cannot be undone.`)) {
            try {
                // This is correct: It deletes all the data for that month.
                localStorage.removeItem(getDbKey('expenses', month));
                localStorage.removeItem(getDbKey('budgets', month));
                localStorage.removeItem(getDbKey('notes', month));
                localStorage.removeItem(getDbKey('limits', month));

                // We DO NOT delete the appliedMonths flag.
                // This ensures that if you re-create the month,
                // autoAddRepeatedExpenses will NOT run.

                showNotification(`All data for ${monthName} ${year} has been deleted.`, 'success');

                renderMonthFolders();
            } catch (error) {
                console.error("Error deleting month data:", error);
                showNotification('An error occurred while deleting data.', 'error');
            }
        }
    };
    // --- END OF CORRECTED FUNCTION ---

    window.deleteBudget = (budgetId) => {
        // This is now more complex because a budget might be linked to an expense
        const budgetToDelete = currentBudgets.find(b => b.id === budgetId);
        if (!budgetToDelete) return;

        currentBudgets = currentBudgets.filter(b => b.id !== budgetId);
        saveBudgets(currentMonth, currentBudgets);

        // If it was a debt/loan, also delete its linked unpaid expense
        if (budgetToDelete.type === 'debt' || budgetToDelete.type === 'loan') {
            const linkedExpense = currentExpenses.find(e => e.budgetId === budgetId && e.paid === false);
            if (linkedExpense) {
                currentExpenses = currentExpenses.filter(e => e.id !== linkedExpense.id);
                saveExpenses(currentMonth, currentExpenses);
            }
        }

        updateAllDisplays();
        showNotification('Budget source deleted.', 'success');
    };
    window.markExpenseAsPaid = (expenseId) => {
        const expense = currentExpenses.find(e => e.id === expenseId);
        if (expense) {
            expense.paid = !expense.paid;
            saveExpenses(currentMonth, currentExpenses);
            updateAllDisplays();
            showNotification(expense.paid ? 'Expense marked as paid!' : 'Expense marked as unpaid.', 'info');
        }
    };
    window.deleteExpense = (expenseId) => {
        const expenseToDelete = currentExpenses.find(e => e.id === expenseId);
        if (!expenseToDelete) return;

        currentExpenses = currentExpenses.filter(e => e.id !== expenseId);
        saveExpenses(currentMonth, currentExpenses);

        // If this expense was a linked debt/loan, also delete the budget item
        if (expenseToDelete.budgetId) {
            currentBudgets = currentBudgets.filter(b => b.id !== expenseToDelete.budgetId);
            saveBudgets(currentMonth, currentBudgets);
        }

        updateAllDisplays();
        showNotification('Expense deleted.', 'success');
    };
    window.deleteNote = (noteId) => {
        currentNotes = currentNotes.filter(n => n.id !== noteId);
        saveNotes(currentMonth, currentNotes);
        renderNotesList();
        showNotification('Note deleted.', 'success');
    };
    document.addEventListener('DOMContentLoaded', init);

})();
