document.addEventListener('DOMContentLoaded', () => {
    const departmentElements = document.querySelectorAll('.node');
    const modal = document.getElementById('employee-modal');
    const editButton = document.getElementById('edit-button');
    const closeBtn = document.querySelector('.close');
    const eventForm = document.getElementById('event-form');
    const addEmployeeButton = document.getElementById('add-employee-button');
    const fireButton = document.getElementById('fire-button');
    let currentEmployee = null;
    let pastEvents = [];
    let currentEvents = [];
    let futureEvents = [];
    let activeFilters = new Set(['current', 'future']);

    let managerOptions = [];
    let assistantOptions = [];

    editButton.addEventListener('click', () => {
        // Разблокировка полей ввода и кнопки сохранения
        document.querySelectorAll('#employee-form input, #employee-form select, #employee-form textarea').forEach(el => {
            el.disabled = false;
        });
        document.querySelector('#employee-form button[type="submit"]').disabled = false;
    });

    // Функция для получения данных с сервера
    const fetchData = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка:', error);
            return null;
        }
    };

    // Открытие пустого модального окна при нажатии на кнопку добавления
    addEmployeeButton.addEventListener('click', () => {
        clearModalData();
        modal.style.display = 'block';
    });

    async function fetchEmployeesByDepartment(departmentId) {
        return fetchData(`http://localhost:3000/api/v1/employees/${departmentId}`)
            .then(data => {
                if (!Array.isArray(data)) {
                    throw new Error('Expected an array of employees');
                }
                return data;
            });
    }

    async function fetchEmployeesForSpecificDepartments(departmentIds) {
        let allEmployees = [];
        for (let deptId of departmentIds) {
            const employees = await fetchEmployeesByDepartment(deptId);
            allEmployees = allEmployees.concat(employees);
        }
        return allEmployees;
    }

    function displayEmployees(employees) {
        const employeeContainer = document.getElementById('employee-container');
        employeeContainer.innerHTML = ''; // Очистить предыдущих сотрудников

        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        employees.forEach(employee => {
            const firedDate = employee.fired_date ? new Date(employee.fired_date) : null;

            // Пропускаем сотрудников, уволенных больше 30 дней назад
            if (firedDate && firedDate < thirtyDaysAgo) {
                return;
            }

            const employeeCard = document.createElement('div');
            employeeCard.className = 'card';
            employeeCard.dataset.employeeId = employee.id;

            // Добавляем класс для серого отображения сотрудников, уволенных в последние 30 дней
            if (firedDate && firedDate >= thirtyDaysAgo) {
                employeeCard.classList.add('fired-recently');
            }

            employeeCard.innerHTML = `
            <div class="card-header">
                <p class="emp-department">${employee.department.name}</p>
                <div>-</div>
                <p class="emp-position">${employee.position.name}</p>
            </div>
            <div class="card-main">
                <p class="emp-name">${employee.last_name} ${employee.first_name} ${employee.middle_name || ''}</p>
                <div><p class="emp-number">${employee.work_phone}</p> <p class="emp-email">${employee.email}</p></div>
            </div>
            <p class="emp-office">${employee.department.office.office}</p>
        `;

            employeeCard.addEventListener('click', () => {
                currentEmployee = employee;
                showEmployeeModal(employeeCard);
            });

            employeeContainer.appendChild(employeeCard);
        });
    }

    function updateManagerAndAssistantOptions(employees) {
        const managerSelect = document.getElementById('employee-manager');
        const assistantSelect = document.getElementById('employee-assistant');

        managerSelect.innerHTML = '<option value="">Выберите руководителя</option>';
        assistantSelect.innerHTML = '<option value="">Выберите помощника</option>';

        managerOptions = [];
        assistantOptions = [];

        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = `${employee.last_name} ${employee.first_name} ${employee.middle_name || ''}`;
            managerOptions.push(option);
            assistantOptions.push(option.cloneNode(true));
        });

        managerOptions.forEach(option => managerSelect.appendChild(option));
        assistantOptions.forEach(option => assistantSelect.appendChild(option));
    }

    function showEmployeeModal(employeeCard) {
        document.getElementById('employee-name').value = employeeCard.querySelector('.emp-name').textContent;
        document.getElementById('employee-mobile').value = currentEmployee.personal_number;
        document.getElementById('employee-birthday').value = currentEmployee.birth_date;
        document.getElementById('employee-department').value = employeeCard.querySelector('.emp-department').textContent;
        document.getElementById('employee-position').value = employeeCard.querySelector('.emp-position').textContent;
        document.getElementById('employee-work-phone').value = employeeCard.querySelector('.emp-number').textContent;
        document.getElementById('employee-email').value = employeeCard.querySelector('.emp-email').textContent;
        document.getElementById('employee-office').value = employeeCard.querySelector('.emp-office').textContent;
        document.getElementById('employee-info').value = currentEmployee.additional_info || '';

        fetchEmployeesByDepartment(currentEmployee.department_id)
            .then(employees => {
                updateManagerAndAssistantOptions(employees);

                // Устанавливаем выбранные значения для руководителя и помощника
                document.getElementById('employee-manager').value = currentEmployee.manager_id || '';
                document.getElementById('employee-assistant').value = currentEmployee.assistant_id || '';

                if (currentEmployee.Fired) {
                    fireButton.style.display = 'none'; // Скрываем кнопку, если сотрудник уже уволен
                } else {
                    fireButton.style.display = 'block'; // Показываем кнопку, если сотрудник не уволен
                }

                modal.style.display = 'block';
            })
            .catch(error => console.error('Ошибка:', error));

        fetchAndDistributeEvents(currentEmployee.id).then(() => {
            applySelectedFilters(); // Применяем выбранные фильтры
        });
    }

    function fetchAndDistributeEvents(employeeId) {
        return Promise.all([
            fetch(`http://localhost:3000/api/v1/employee/${employeeId}/trainings`).then(response => response.json()),
            fetch(`http://localhost:3000/api/v1/employee/${employeeId}/absences`).then(response => response.json()),
            fetch(`http://localhost:3000/api/v1/employee/${employeeId}/leaves`).then(response => response.json())
        ]).then(([trainings, absences, leaves]) => {
            if (Array.isArray(trainings)) {
                distributeEvents(trainings, 'training');
            }
            if (Array.isArray(absences)) {
                distributeEvents(absences, 'absence');
            }
            if (Array.isArray(leaves)) {
                distributeEvents(leaves, 'leave');
            }
        }).catch(error => console.error('Ошибка загрузки событий:', error));
    }

    function distributeEvents(events, eventType) {
        const now = new Date();

        // Очищаем массивы перед распределением новых данных
        pastEvents = pastEvents.filter(event => event.type !== eventType);
        currentEvents = currentEvents.filter(event => event.type !== eventType);
        futureEvents = futureEvents.filter(event => event.type !== eventType);

        events.forEach(event => {
            const startDate = new Date(event.start_date);
            const endDate = new Date(event.end_date);

            if (endDate < now) {
                pastEvents.push({ ...event, type: eventType });
            } else if (startDate <= now && endDate >= now) {
                currentEvents.push({ ...event, type: eventType });
            } else if (startDate > now) {
                futureEvents.push({ ...event, type: eventType });
            }
        });
    }

    function deleteEvent(eventId, eventType, eventElement) {
        let deleteUrl;
        switch (eventType) {
            case 'absence':
                deleteUrl = `http://localhost:3000/api/v1/employee/${currentEmployee.id}/absences/${eventId}`;
                break;
            case 'training':
                deleteUrl = `http://localhost:3000/api/v1/employee/${currentEmployee.id}/trainings/${eventId}`;
                break;
            case 'leave':
                deleteUrl = `http://localhost:3000/api/v1/employee/${currentEmployee.id}/leaves/${eventId}`;
                break;
            default:
                console.error("Неизвестный тип события:", eventType);
                return;
        }

        fetch(deleteUrl, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                // Удаляем элемент из DOM
                eventElement.remove();
                // Перезапрашиваем и распределяем события
                fetchAndDistributeEvents(currentEmployee.id).then(() => {
                    applySelectedFilters(); // Применяем выбранные фильтры после обновления
                });
            })
            .catch(error => console.error('Ошибка удаления события:', error));
    }

    function applyFilters(events) {
        const absenceList = document.getElementById('absence-list');
        const trainingList = document.getElementById('training-list');
        const leaveList = document.getElementById('leave-list');

        absenceList.innerHTML = '';
        trainingList.innerHTML = '';
        leaveList.innerHTML = '';

        events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event record';
            eventElement.innerHTML = `
                <p>${event.start_date} - ${event.end_date}</p>
                <p>${event.description || ''}</p>
                <button class="delete-event" data-event-id="${event.id}" data-event-type="${event.type}">Удалить</button>
            `;

            const deleteButton = eventElement.querySelector('.delete-event');
            deleteButton.addEventListener('click', () => {
                deleteEvent(deleteButton.getAttribute('data-event-id'), deleteButton.getAttribute('data-event-type'), eventElement);
            });

            if (event.type === 'absence') {
                absenceList.appendChild(eventElement);
            } else if (event.type === 'training') {
                trainingList.appendChild(eventElement);
            } else if (event.type === 'leave') {
                leaveList.appendChild(eventElement);
            }
        });
    }

    function applySelectedFilters() {
        const filteredEvents = [];

        if (activeFilters.size === 0) {
            // Если фильтры не выбраны, отображаем все события
            filteredEvents.push(...pastEvents, ...currentEvents, ...futureEvents);
        } else {
            if (activeFilters.has('past')) {
                filteredEvents.push(...pastEvents);
            }
            if (activeFilters.has('current')) {
                filteredEvents.push(...currentEvents);
            }
            if (activeFilters.has('future')) {
                filteredEvents.push(...futureEvents);
            }
        }

        applyFilters(filteredEvents);
    }

    document.querySelectorAll('.event-filter').forEach(button => {
        const filter = button.dataset.filter;

        // Устанавливаем активный класс для текущих и будущих событий по умолчанию
        if (activeFilters.has(filter)) {
            button.classList.add('active');
        }

        button.addEventListener('click', () => {
            // Добавляем или удаляем фильтр в зависимости от текущего состояния
            if (activeFilters.has(filter)) {
                activeFilters.delete(filter);
                button.classList.remove('active');
            } else {
                activeFilters.add(filter);
                button.classList.add('active');
            }

            // Применяем выбранные фильтры
            applySelectedFilters();
        });
    });

    departmentElements.forEach(department => {
        department.addEventListener('click', () => {
            const departmentId = department.dataset.departmentId;

            departmentElements.forEach(dept => dept.classList.remove('active'));
            department.classList.add('active');

            // Определяем, какие подразделения нужно загрузить в зависимости от departmentId
            let departmentsToLoad;
            if (departmentId === '0') {
                departmentsToLoad = [0, 1, 12, 3, 4, 30, 31]; // Загружаем всех сотрудников
            } else if (departmentId === '1') {
                departmentsToLoad = [1, 3, 4]; // Загружаем сотрудников из 1, 3 и 4
            } else if (departmentId === '4') {
                departmentsToLoad = [4, 30, 31]; // Загружаем сотрудников из 4, 30 и 31
            } else {
                departmentsToLoad = [departmentId]; // Загружаем сотрудников только из указанного подразделения
            }

            fetchEmployeesForSpecificDepartments(departmentsToLoad)
                .then(employees => displayEmployees(employees))
                .catch(error => console.error('Ошибка:', error));
        });
    });

    function clearModalData() {
        // Очистка данных формы
        document.getElementById('employee-form').reset();
        document.getElementById('employee-manager').innerHTML = '<option value="">Выберите руководителя</option>';
        document.getElementById('employee-assistant').innerHTML = '<option value="">Выберите помощника</option>';

        // Очистка списков событий
        document.getElementById('absence-list').innerHTML = '';
        document.getElementById('training-list').innerHTML = '';
        document.getElementById('leave-list').innerHTML = '';

        document.querySelectorAll('#employee-form input, #employee-form select, #employee-form textarea').forEach(el => {
            el.disabled = true;
        });
        document.querySelector('#employee-form button[type="submit"]').disabled = false;
    }

    closeBtn.onclick = () => {
        // Очистка массивов событий и списков событий при закрытии
        pastEvents = [];
        currentEvents = [];
        futureEvents = [];
        clearModalData();
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            // Очистка массивов событий и списков событий при закрытии
            pastEvents = [];
            currentEvents = [];
            futureEvents = [];
            clearModalData();
            modal.style.display = 'none';
        }
    };

    function validatePhoneNumber(phoneNumber) {
        const phonePattern = /^(\+7|8)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;
        return phonePattern.test(phoneNumber);
    }

    function validateEmail(email) {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailPattern.test(email);
    }

    document.getElementById('employee-form').onsubmit = (event) => {
        event.preventDefault();

        let isMobileValid = false;
        let isWorkPhoneValid = false;
        let isEmailValid = false;

        if (!currentEmployee) {
            console.error('Нет текущего сотрудника для обновления');
            return;
        }

        const mobile = document.getElementById('employee-mobile').value;
        const workPhone = document.getElementById('employee-work-phone').value;
        const email = document.getElementById('employee-email').value;

        isMobileValid = validatePhoneNumber(mobile);
        isWorkPhoneValid = validatePhoneNumber(workPhone);
        isEmailValid = validateEmail(email);

        console.log("Mobile valid:", isMobileValid); // Для отладки
        console.log("WorkPhone valid:", isWorkPhoneValid); // Для отладки
        console.log("Email valid:", isEmailValid); // Для отладки

        if (!isMobileValid || !isWorkPhoneValid || !isEmailValid) {
            alert("Введите корректные данные")
            return
        }

        const updatedEmployee = {
            last_name: document.getElementById('employee-name').value.split(' ')[0],
            first_name: document.getElementById('employee-name').value.split(' ')[1],
            middle_name: document.getElementById('employee-name').value.split(' ')[2] || '',
            personal_number: mobile,
            birth_date: document.getElementById('employee-birthday').value,
            department: document.getElementById('employee-department').value,
            position: document.getElementById('employee-position').value,
            manager_id: document.getElementById('employee-manager').value || null,
            assistant_id: document.getElementById('employee-assistant').value || null,
            work_phone: workPhone,
            email: email,
            office: document.getElementById('employee-office').value,
            additional_info: document.getElementById('employee-info').value
        };

        updateEmployeeData(currentEmployee.id, updatedEmployee).then(() => {
            // Обновляем карточку сотрудника в DOM
            const employeeCard = document.querySelector(`.card[data-employee-id="${currentEmployee.id}"]`);
            employeeCard.querySelector('.emp-department').textContent = updatedEmployee.department;
            employeeCard.querySelector('.emp-position').textContent = updatedEmployee.position;
            employeeCard.querySelector('.emp-name').textContent = `${updatedEmployee.last_name} ${updatedEmployee.first_name} ${updatedEmployee.middle_name}`;
            employeeCard.querySelector('.emp-number').textContent = updatedEmployee.work_phone;
            employeeCard.querySelector('.emp-email').textContent = updatedEmployee.email;
            employeeCard.querySelector('.emp-office').textContent = updatedEmployee.office;

            // Обновляем данные в модальном окне
            showEmployeeModal(employeeCard);
        });
    };

    function updateEmployeeData(employeeId, updatedEmployee) {
        return fetch(`http://localhost:3000/api/v1/employee/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedEmployee)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Данные успешно обновлены', data);
            })
            .catch(error => {
                console.error('Ошибка обновления данных:', error);
            });
    }

    // Fetch and display department names
    const fetchAndDisplayDepartments = async () => {
        const departments = await fetchData('http://localhost:3000/api/v1/departments');
        if (departments) {
            departments.forEach(department => {
                const element = document.querySelector(`.node[data-department-id="${department.id}"]`);
                if (element) {
                    element.textContent = department.name;
                }
            });
        } else {
            console.error('Не удалось загрузить департаменты');
        }
    };

    // Вызов функции при загрузке страницы
    fetchAndDisplayDepartments();


    eventForm.onsubmit = (event) => {
        event.preventDefault();

        const startDate = new Date(document.getElementById('event-start-date').value);
        const endDate = new Date(document.getElementById('event-end-date').value);

        if (startDate > endDate) {
            alert('Начальная дата не может быть больше конечной даты.');
            return;
        }
    }

    // Обработчик для кнопки увольнения
    fireButton.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите уволить этого сотрудника?')) {
            fireEmployee(currentEmployee.id);
        }
    });

    fireButton.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите уволить этого сотрудника?')) {
            fireEmployee(currentEmployee.id);
        }
    });

    async function fireEmployee(employeeId) {
        try {
            const response = await fetch(`http://localhost:3000/api/v1/employee/fire/${employeeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Ошибка при увольнении сотрудника');
            }

            alert('Сотрудник успешно уволен');
            modal.style.display = 'none';
            // Обновляем отображение сотрудников после увольнения
            fetchEmployeesForSpecificDepartments([currentEmployee.department_id])
                .then(employees => displayEmployees(employees))
                .catch(error => console.error('Ошибка:', error));
        } catch (error) {
            console.error('Ошибка при увольнении сотрудника:', error);
            alert(error.message);
        }
    }
});