/**
 * Todo List Application
 * Manages todos with API integration, search, filtering, and pagination
 */

class TodoApp {
    constructor() {
        this.todos = [];
        this.filteredTodos = [];
        this.currentPage = 1;
        this.todosPerPage = 10;
        this.apiUrl = 'https://dummyjson.com/todos';
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.loadTodos();
    }

    /**
     * Bind event listeners to DOM elements
     */
    bindEvents() {
        // Add todo form submission
        document.getElementById('addTodoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', () => {
            this.applyFilters();
        });

        // Date filters
        document.getElementById('fromDate').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('toDate').addEventListener('change', () => {
            this.applyFilters();
        });

        // Clear filters button
        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadTodos();
        });
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        document.getElementById('loadingIndicator').classList.remove('d-none');
        this.hideError();
        this.hideSuccess();
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        document.getElementById('loadingIndicator').classList.add('d-none');
    }

    /**
     * Show error message
     */
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorAlert').classList.remove('d-none');
        this.hideSuccess();
    }

    /**
     * Hide error message
     */
    hideError() {
        document.getElementById('errorAlert').classList.add('d-none');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        document.getElementById('successMessage').textContent = message;
        document.getElementById('successAlert').classList.remove('d-none');
        this.hideError();
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            this.hideSuccess();
        }, 3000);
    }

    /**
     * Hide success message
     */
    hideSuccess() {
        document.getElementById('successAlert').classList.add('d-none');
    }

    /**
     * Load todos from API
     */
    async loadTodos() {
        try {
            this.showLoading();
            
            const response = await axios.get(this.apiUrl);
            // DummyJSON returns data in format: { todos: [...], total: number }
            this.todos = response.data.todos.map(todo => ({
                id: todo.id,
                title: todo.todo, // DummyJSON uses 'todo' field instead of 'title'
                completed: todo.completed,
                userId: todo.userId,
                createdAt: this.generateRandomDate() // Add random created date for filtering
            }));
            
            this.applyFilters();
            this.hideLoading();
            
        } catch (error) {
            this.hideLoading();
            this.showError(`Failed to load todos: ${error.message}`);
            console.error('Error loading todos:', error);
        }
    }

    /**
     * Generate a random date within the last year for demo purposes
     */
    generateRandomDate() {
        const now = new Date();
        const pastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const randomTime = pastYear.getTime() + Math.random() * (now.getTime() - pastYear.getTime());
        return new Date(randomTime).toISOString().split('T')[0];
    }

    /**
     * Add a new todo
     */
    async addTodo() {
        try {
            const title = document.getElementById('todoTitle').value.trim();
            const userId = parseInt(document.getElementById('todoUserId').value);

            if (!title) {
                this.showError('Please enter a task title');
                return;
            }

            this.showLoading();

            const newTodo = {
                todo: title, // DummyJSON uses 'todo' field instead of 'title'
                completed: false,
                userId: userId
            };

            const response = await axios.post(`${this.apiUrl}/add`, newTodo);
            
            // Add the new todo to local array with generated data
            const addedTodo = {
                id: response.data.id || (this.todos.length + 1), // Use response ID or generate
                title: response.data.todo || title, // Map 'todo' field to 'title'
                completed: response.data.completed,
                userId: response.data.userId,
                createdAt: new Date().toISOString().split('T')[0]
            };
            
            this.todos.unshift(addedTodo); // Add to beginning of array
            
            // Clear form
            document.getElementById('addTodoForm').reset();
            document.getElementById('todoUserId').value = '1';
            
            this.applyFilters();
            this.hideLoading();
            this.showSuccess('Todo added successfully!');
            
        } catch (error) {
            this.hideLoading();
            this.showError(`Failed to add todo: ${error.message}`);
            console.error('Error adding todo:', error);
        }
    }

    /**
     * Toggle todo completion status
     */
    async toggleTodo(todoId) {
        try {
            const todoIndex = this.todos.findIndex(todo => todo.id === todoId);
            if (todoIndex === -1) return;

            const todo = this.todos[todoIndex];
            const updatedTodo = { ...todo, completed: !todo.completed };

            // Update locally immediately for better UX
            this.todos[todoIndex] = updatedTodo;
            this.applyFilters();

            // Attempt to update on server using DummyJSON format
            try {
                const updateData = {
                    completed: updatedTodo.completed
                };
                await axios.put(`${this.apiUrl}/${todoId}`, updateData);
                this.showSuccess(`Todo ${updatedTodo.completed ? 'completed' : 'marked as pending'}!`);
            } catch (error) {
                // If server update fails, still keep local change
                console.warn('Server update failed, keeping local change:', error);
            }

        } catch (error) {
            this.showError(`Failed to update todo: ${error.message}`);
            console.error('Error updating todo:', error);
        }
    }

    /**
     * Delete a todo
     */
    async deleteTodo(todoId) {
        try {
            if (!confirm('Are you sure you want to delete this todo?')) {
                return;
            }

            // Remove from local array immediately
            this.todos = this.todos.filter(todo => todo.id !== todoId);
            this.applyFilters();

            // Attempt to delete from server
            try {
                await axios.delete(`${this.apiUrl}/${todoId}`);
                this.showSuccess('Todo deleted successfully!');
            } catch (error) {
                // If server delete fails, still keep local change
                console.warn('Server delete failed, keeping local change:', error);
            }

        } catch (error) {
            this.showError(`Failed to delete todo: ${error.message}`);
            console.error('Error deleting todo:', error);
        }
    }

    /**
     * Apply search and date filters
     */
    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;

        this.filteredTodos = this.todos.filter(todo => {
            // Search filter
            const matchesSearch = !searchTerm || 
                todo.title.toLowerCase().includes(searchTerm);

            // Date filter
            const todoDate = todo.createdAt;
            const matchesFromDate = !fromDate || todoDate >= fromDate;
            const matchesToDate = !toDate || todoDate <= toDate;

            return matchesSearch && matchesFromDate && matchesToDate;
        });

        this.currentPage = 1; // Reset to first page
        this.renderTodos();
        this.renderPagination();
        this.updateStatistics();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('fromDate').value = '';
        document.getElementById('toDate').value = '';
        this.applyFilters();
    }

    /**
     * Get paginated todos for current page
     */
    getPaginatedTodos() {
        const startIndex = (this.currentPage - 1) * this.todosPerPage;
        const endIndex = startIndex + this.todosPerPage;
        return this.filteredTodos.slice(startIndex, endIndex);
    }

    /**
     * Render todos list
     */
    renderTodos() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const paginatedTodos = this.getPaginatedTodos();

        if (paginatedTodos.length === 0) {
            todoList.innerHTML = '';
            emptyState.classList.remove('d-none');
            return;
        }

        emptyState.classList.add('d-none');

        todoList.innerHTML = paginatedTodos.map(todo => `
            <div class="list-group-item d-flex justify-content-between align-items-start">
                <div class="ms-2 me-auto">
                    <div class="d-flex align-items-center">
                        <input 
                            type="checkbox" 
                            class="form-check-input me-3" 
                            ${todo.completed ? 'checked' : ''} 
                            onchange="todoApp.toggleTodo(${todo.id})"
                        >
                        <div class="flex-grow-1">
                            <h6 class="mb-1 ${todo.completed ? 'text-decoration-line-through text-muted' : ''}">
                                ${this.escapeHtml(todo.title)}
                            </h6>
                            <small class="text-muted">
                                <i class="fas fa-user me-1"></i>User ${todo.userId} • 
                                <i class="fas fa-calendar me-1"></i>${todo.createdAt}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <span class="badge ${todo.completed ? 'bg-success' : 'bg-warning'} me-2">
                        ${todo.completed ? 'Completed' : 'Pending'}
                    </span>
                    <button 
                        class="btn btn-outline-danger btn-sm" 
                        onclick="todoApp.deleteTodo(${todo.id})"
                        title="Delete todo"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render pagination controls
     */
    renderPagination() {
        const pagination = document.getElementById('pagination');
        const pageInfo = document.getElementById('pageInfo');
        const totalPages = Math.ceil(this.filteredTodos.length / this.todosPerPage);

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            pageInfo.textContent = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="todoApp.goToPage(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                paginationHTML += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="todoApp.goToPage(${i})">${i}</a>
                    </li>
                `;
            } else if (Math.abs(i - this.currentPage) === 3) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="todoApp.goToPage(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;

        // Page info
        const startItem = (this.currentPage - 1) * this.todosPerPage + 1;
        const endItem = Math.min(this.currentPage * this.todosPerPage, this.filteredTodos.length);
        pageInfo.textContent = `Showing ${startItem}-${endItem} of ${this.filteredTodos.length} todos`;
    }

    /**
     * Navigate to specific page
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredTodos.length / this.todosPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderTodos();
        this.renderPagination();
    }

    /**
     * Update statistics display
     */
    updateStatistics() {
        const totalTodos = this.todos.length;
        const completedTodos = this.todos.filter(todo => todo.completed).length;
        const pendingTodos = totalTodos - completedTodos;
        const filteredCount = this.filteredTodos.length;

        document.getElementById('totalTodos').textContent = totalTodos;
        document.getElementById('completedTodos').textContent = completedTodos;
        document.getElementById('pendingTodos').textContent = pendingTodos;
        document.getElementById('filteredTodos').textContent = filteredCount;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});
