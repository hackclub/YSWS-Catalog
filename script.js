let programs = {};
const apiUrl = "https://api2.hackclub.com/v0.1/Unified%20YSWS%20Projects%20DB/YSWS%20Programs?cache=true";
let participants = [];
let initialParticipants = new Map();
let completedPrograms = new Set();

function loadCompletedPrograms() {
    const saved = localStorage.getItem('completedPrograms');
    if (saved) {
        completedPrograms = new Set(JSON.parse(saved));
    }
}

function saveCompletedPrograms() {
    localStorage.setItem('completedPrograms', JSON.stringify([...completedPrograms]));
}

function toggleProgramCompletion(programName, event) {
    if (event) {
        event.stopPropagation();
    }
    
    if (completedPrograms.has(programName)) {
        completedPrograms.delete(programName);
    } else {
        completedPrograms.add(programName);
    }
    
    saveCompletedPrograms();
    updateCompletionUI(programName);
}

function updateCompletionUI(programName) {
    const isCompleted = completedPrograms.has(programName);
    
    document.querySelectorAll(`.program-card[data-name="${programName}"]`).forEach(card => {
        const completionBtn = card.querySelector('.program-completion-toggle');
        const completionBadge = card.querySelector('.user-completed-badge');
        
        if (completionBtn) {
            completionBtn.innerHTML = isCompleted ? 
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : 
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';
            
            completionBtn.setAttribute('aria-label', isCompleted ? 'Mark as not completed' : 'Mark as completed');
            completionBtn.classList.toggle('completed', isCompleted);
        }
        
        if (completionBadge) {
            completionBadge.classList.toggle('visible', isCompleted);
        }
    });
    
    const modal = document.getElementById('program-modal');
    if (modal.classList.contains('active')) {
        const modalTitle = modal.querySelector('.title').textContent;
        if (modalTitle === programName) {
            const modalCompletionBtn = modal.querySelector('.modal-completion-toggle');
            if (modalCompletionBtn) {
                modalCompletionBtn.innerHTML = isCompleted ? 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Completed' : 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg> Mark as completed';
                
                modalCompletionBtn.classList.toggle('completed', isCompleted);
            }
            
            const modalCompletionBadge = modal.querySelector('.modal-completion-badge');
            if (modalCompletionBadge) {
                modalCompletionBadge.classList.toggle('visible', isCompleted);
            }
        }
    }
}

async function startRender() {
    loadCompletedPrograms();
    await loadPrograms();
    Object.values(programs).flat().forEach(program => {
        if (program.participants !== undefined) {
            initialParticipants.set(program.name, program.participants);
        }
    });
    
    renderPrograms();
    await loadParticipants();
    updateParticipantCounts();
}

function loadParticipants() {
    return fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to Fetch Participants Data! ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            participants = data.map(item => ({
                name: item.fields.Name,
                total: item.fields["Unweighted–Total"],
                id: item.id
            }));
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
}

const unifiedDbOverrides = {
    "HackCraft": "recE2drMuGXUWJi3L",
};

function animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const startNum = parseInt(start) || 0;
    const endNum = parseInt(end) || 0;
    const numberSpan = element.querySelector('span');
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuad = 1 - Math.pow(1 - progress, 2);
        const current = Math.round(startNum + (endNum - startNum) * easeOutQuad);
        
        numberSpan.textContent = current;
        element.textContent = `${current} participant${current !== 1 ? 's' : ''}`;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.classList.remove('updating');
        }
    }
    
    element.classList.add('updating');
    requestAnimationFrame(update);
}

function updateParticipantCounts() {
    const participantElements = document.querySelectorAll('.program-participants');
    
    participantElements.forEach(element => {
        const programCard = element.closest('.program-card');
        const programData = JSON.parse(decodeURIComponent(programCard.dataset.program));
        const programName = programData.name;
        
        const overrideId = unifiedDbOverrides[programName];
        const apiData = overrideId
            ? participants.find(p => p.id === overrideId)
            : participants.find(p => p.name === programName);
        if (apiData) {
            const initialCount = initialParticipants.get(programName) || 0;
            animateNumber(element, initialCount, apiData.total);
        }
    });
}

function getParticipantsByName(programName) {
    if (!participants.length) {
        console.error("Data has not been fetched yet. Please wait...");
        return;
    }

    const program = participants.find(item => item.name.toLowerCase() === programName.toLowerCase());
    
    if (program) {
        console.log(`Program: ${program.name}, Participants: ${program.total}`);
        return program.total;
    } else {
        console.log(`Program "${programName}" not found.`);
        return null;
    }
}

function isEventEnded(deadline) {
    if (!deadline) return false;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return now > deadlineDate;
}

async function loadPrograms() {
    try {
        const response = await fetch('data.yml').then(res => res.text());
        const rawPrograms = jsyaml.load(response);
        
        const ended = [];
        programs = Object.fromEntries(
            Object.entries(rawPrograms).map(([category, programsList]) => [
            category,
            (programsList && Array.isArray(programsList)) ? 
                programsList.filter(program => {
                if (program.status === 'ended' || isEventEnded(program.deadline)) {
                    ended.push({ ...program, status: 'ended' });
                    return false;
                }
                return true;
                }) : []
            ])
        );

        delete programs['Ended'];
        if (ended.length > 0) {
            programs['Ended'] = ended;
        }
        
        programs = Object.fromEntries(
            Object.entries(programs).filter(([_, programsList]) => programsList.length > 0)
        );
    } catch (error) {
        console.error('Error loading programs:', error);
    }
}

function formatDeadline(deadlineStr, opensStr, endedStr) {
    if (opensStr) {
        const opensDate = new Date(opensStr);
        const now = new Date();
        if (now < opensDate) {
            return `Opens ${opensDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: opensDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            })}`;
        }
    }
    
    if (endedStr) {
        if (endedStr.match(/^\d{4}-\d{2}-\d{2}/) || endedStr.includes('T')) {
            const endedDate = new Date(endedStr);
            if (!isNaN(endedDate.getTime())) {
                return `Ended on ${endedDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: endedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                })}`;
            }
        }
        return endedStr;
    }
    
    if (!deadlineStr) return '';
    
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    if (diffDays === 1) return 'Ends tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    if (diffDays <= 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} left`;
    }
    
    return `Ends ${deadline.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: deadline.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })}`;
}

function getDeadlineClass(deadlineStr) {
    if (!deadlineStr) return '';
    
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'ended';
    if (diffDays <= 7) return 'very-urgent';
    if (diffDays <= 14) return 'urgent';
    return '';
}

function formatParticipants(name) {
    const initial = initialParticipants.get(name);
    if (initial === undefined) return '';
    return `<span>${initial}</span> participant${initial !== 1 ? 's' : ''}`;
}

function formatUpdatedParticipants(name) {
    let count = getParticipantsByName(name);
    if (count === null) {
        count = initialParticipants.get(name) || 0;
    }
    return `<span>${count}</span> participant${count !== 1 ? 's' : ''}`;
}

function createProgramCard(program) {
    const deadlineText = formatDeadline(program.deadline, program.opens, program.ended);
    const deadlineClass = getDeadlineClass(program.deadline);
    
    const opensClass = program.opens && new Date() < new Date(program.opens) ? 'opens-soon' : '';
    const blueprintClass = program.name === 'Blueprint' ? 'blueprint-card' : '';
    
    const encodedProgram = encodeURIComponent(JSON.stringify(program));
    
    const isCompletedByUser = completedPrograms.has(program.name);
    const completionButtonClass = isCompletedByUser ? 'completed' : '';
    const completionIcon = isCompletedByUser ? 
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : 
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';
    
    const participantsText = program.participants !== undefined ? 
        `<div class="program-participants">${formatParticipants(program.name)}</div>` : '';
    
    return `
        <div class="card program-card ${opensClass} ${blueprintClass}" data-program="${encodedProgram}" data-name="${program.name}">
            <div class="program-header">
                <h3>${program.name}</h3>
                <div class="status-container">
                    <span class="user-completed-badge ${isCompletedByUser ? 'visible' : ''}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Completed
                    </span>
                    <span class="program-status status-${program.status}">${program.status}</span>
                </div>
            </div>
            <p>${program.description}</p>
            <div class="program-deadline ${deadlineClass}">${deadlineText}</div>
            ${participantsText}
            <div class="program-footer">
                <div class="program-links">
                    ${program.website ? `<a href="${program.website}" target="_blank">Website</a>` : ''}
                    ${program.slack ? `<a href="${program.slack}" target="_blank">${program.slackChannel}</a>` : ''}
                </div>
                <button class="program-completion-toggle ${completionButtonClass}" aria-label="${isCompletedByUser ? 'Mark as not completed' : 'Mark as completed'}" data-program-name="${program.name}">
                    ${completionIcon}
                </button>
            </div>
        </div>
    `;
}

let currentProgramIndex = 0;
let visiblePrograms = [];

function updateVisiblePrograms() {
    visiblePrograms = Array.from(document.querySelectorAll('.program-card'))
        .filter(card => !card.classList.contains('hidden-by-filter') && 
                       !card.classList.contains('hidden-by-search'))
        .map(card => JSON.parse(decodeURIComponent(card.dataset.program)));
}

function updatePositionIndicator() {
    const positionElement = document.querySelector('.current-position');
    if (visiblePrograms.length > 0) {
        positionElement.textContent = `${currentProgramIndex + 1} of ${visiblePrograms.length}`;
    } else {
        positionElement.textContent = '';
    }
}

function navigateModal(direction) {
    updateVisiblePrograms();
    
    if (visiblePrograms.length === 0) return;
    
    currentProgramIndex = (currentProgramIndex + direction + visiblePrograms.length) % visiblePrograms.length;
    openModal(visiblePrograms[currentProgramIndex]);
    updatePositionIndicator();
}

function openModal(program) {
    updateVisiblePrograms();
    currentProgramIndex = visiblePrograms.findIndex(p => p.name === program.name);
    
    const modal = document.getElementById('program-modal');
    const body = document.body;
    
    modal.querySelector('.title').textContent = program.name;
    modal.querySelector('.program-status').className = `program-status status-${program.status}`;
    modal.querySelector('.program-status').textContent = program.status;
    
    modal.querySelector('.program-description').textContent = 
        program.detailedDescription || program.description;
    
    const deadlineElement = modal.querySelector('.program-deadline');
    const deadlineText = formatDeadline(program.deadline, program.opens, program.ended);
    const deadlineClass = getDeadlineClass(program.deadline);
    deadlineElement.className = `program-deadline ${deadlineClass}`;
    deadlineElement.textContent = deadlineText;

    const defaultSteps = [
        program.website ? `Visit the <a href="${program.website}" target="_blank">program website</a>` : null,
        program.slack ? `Join the discussion in <a href="${program.slack}" target="_blank">${program.slackChannel}</a>` : null
    ].filter(Boolean);

    const steps = program.steps || defaultSteps;
    
    modal.querySelector('.participation-steps').innerHTML = steps
        .map((step, index) => `${index + 1}. ${step}`)
        .join('<br>');
    
    const moreDetailsElement = modal.querySelector('.more-details');
    let detailsHTML = '';
    
    if (program.participants !== undefined) {
        detailsHTML += `
            <h3>Participation</h3>
            <p>${formatUpdatedParticipants(program.name)}</p>
        `;
    }
    
    if (program.requirements?.length) {
        detailsHTML += `
            <h3>Requirements</h3>
            <ul>
                ${program.requirements.map(req => `<li>${req}</li>`).join('')}
            </ul>
        `;
    }
    
    if (program.details?.length) {
        detailsHTML += `
            <h3>Additional Details</h3>
            <ul>
                ${program.details.map(detail => `<li>${detail}</li>`).join('')}
            </ul>
        `;
    }
    
    moreDetailsElement.innerHTML = detailsHTML;
    
    const links = [];
    if (program.website) links.push(`<a href="${program.website}" target="_blank">Website</a>`);
    if (program.slack) links.push(`<a href="${program.slack}" target="_blank">${program.slackChannel}</a>`);
    modal.querySelector('.program-links').innerHTML = links.join(' | ');
    
    const isCompletedByUser = completedPrograms.has(program.name);
    const modalCompletionBtn = modal.querySelector('.modal-completion-toggle');
    modalCompletionBtn.innerHTML = isCompletedByUser ? 
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Completed' : 
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg> Mark as completed';
    modalCompletionBtn.classList.toggle('completed', isCompletedByUser);
    modalCompletionBtn.dataset.programName = program.name;
    
    const modalCompletionBadge = modal.querySelector('.modal-completion-badge');
    modalCompletionBadge.classList.toggle('visible', isCompletedByUser);

    updatePositionIndicator();
    modal.classList.add('active');
    body.classList.add('modal-open');
}

function closeModal() {
    const modal = document.getElementById('program-modal');
    const body = document.body;
    
    modal.classList.remove('active');
    body.classList.remove('modal-open');
}

function countActivePrograms() {
    let count = 0;
    Object.values(programs).forEach(category => {
        count += category.filter(program => program.status === 'active').length;
    });
    return count;
}

let currentSort = 'default';

function sortPrograms(programs, sortType) {
    const flattened = Object.entries(programs).flatMap(([category, progs]) => 
        progs.map(p => ({...p, category}))
    );

    switch(sortType) {
        case 'alphabetical':
            return flattened.sort((a, b) => a.name.localeCompare(b.name));
        case 'deadline':
            return flattened.sort((a, b) => {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            });
        case 'status':
            const statusOrder = { active: 0, draft: 1, completed: 2 };
            return flattened.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        default:
            return flattened;
    }
}

function renderPrograms() {
    const container = document.getElementById('programs-container');
    container.innerHTML = '';
    const activeCount = countActivePrograms();
    document.getElementById('active-count').textContent = activeCount;
    
    if (currentSort === 'default') {
        for (const [category, programsList] of Object.entries(programs)) {
            const section = document.createElement('section');
            section.className = 'category-section';
            section.innerHTML = `
                <h2 class="headline">${category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h2>
                <div class="programs-grid">
                    ${programsList.map(program => createProgramCard(program)).join('')}
                </div>
            `;
            container.appendChild(section);
        }
    } else {
        const sortedPrograms = sortPrograms(programs, currentSort);
        const section = document.createElement('section');
        section.className = 'category-section';
        section.innerHTML = `
            <div class="programs-grid">
                ${sortedPrograms.map(program => createProgramCard(program)).join('')}
            </div>
        `;
        container.appendChild(section);
    }
}

function updateSort(sortType) {
    currentSort = sortType;
    const buttons = document.querySelectorAll('.sort-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sortType);
    });
    renderPrograms();
    
    const activeFilter = document.querySelector('.filter-btn.active');
    if (activeFilter) {
        filterPrograms(activeFilter.dataset.category);
    }
    const searchInput = document.getElementById('program-search');
    if (searchInput.value) {
        searchPrograms(searchInput.value);
    }
}

function filterPrograms(category) {
    const sections = document.querySelectorAll('.category-section');
    const buttons = document.querySelectorAll('.filter-btn');

    document.getElementById('user-completed-empty').classList.remove('visible');
    document.getElementById('user-not-completed-empty').classList.remove('visible');

    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    sections.forEach(section => {
        const programCards = section.querySelectorAll('.program-card');
        
        programCards.forEach(card => {
            const statusElement = card.querySelector('.program-status');
            const deadlineElement = card.querySelector('.program-deadline');
            const status = statusElement.textContent;
            const programName = card.getAttribute('data-name');
            const isCompletedByUser = completedPrograms.has(programName);
            
            if (category === 'all') {
                card.classList.remove('hidden-by-filter');
            } else if (category === 'ending-soon') {
                const isEndingSoon = deadlineElement && 
                    ['urgent', 'very-urgent'].some(cls => 
                        deadlineElement.classList.contains(cls));
                card.classList.toggle('hidden-by-filter', !isEndingSoon);
            } else if (category === 'user-completed') {
                card.classList.toggle('hidden-by-filter', !isCompletedByUser);
            } else if (category === 'user-not-completed') {
                card.classList.toggle('hidden-by-filter', isCompletedByUser);
            } else if (category === 'ended') {
                card.classList.toggle('hidden-by-filter', status !== 'ended');
            } else {
                card.classList.toggle('hidden-by-filter', status !== category);
            }
        });

        const hasVisibleCards = Array.from(programCards)
            .some(card => !card.classList.contains('hidden-by-filter') && 
                         !card.classList.contains('hidden-by-search'));
        section.classList.toggle('hidden', !hasVisibleCards);
    });

    if (category === 'user-completed' || category === 'user-not-completed') {
        const allProgramCards = document.querySelectorAll('.program-card');
        const hasVisibleCards = Array.from(allProgramCards).some(card => 
            !card.classList.contains('hidden-by-filter') && 
            !card.classList.contains('hidden-by-search')
        );

        if (!hasVisibleCards) {
            if (category === 'user-completed') {
                document.getElementById('user-completed-empty').classList.add('visible');
            } else {
                document.getElementById('user-not-completed-empty').classList.add('visible');
            }
        }
    }
}

function searchPrograms(searchTerm) {
    const programCards = document.querySelectorAll('.program-card');
    searchTerm = searchTerm.toLowerCase().trim();

    programCards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const slackChannel = card.querySelector('.program-links')?.textContent.toLowerCase() || '';
        
        const matches = name.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       slackChannel.includes(searchTerm);
        
        card.classList.toggle('hidden-by-search', !matches);
    });

    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
        const hasVisibleCards = Array.from(section.querySelectorAll('.program-card'))
            .some(card => !card.classList.contains('hidden-by-filter') && 
                         !card.classList.contains('hidden-by-search'));
        section.classList.toggle('hidden', !hasVisibleCards);
    });
}

function toggleTheme() {
    const body = document.body;
    const toggleBtn = document.getElementById('theme-toggle');
    const isDark = body.classList.toggle('dark-theme');
    
    toggleBtn.textContent = isDark ? '☀️' : '🌙';
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const toggleBtn = document.getElementById('theme-toggle');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-theme');
        toggleBtn.textContent = '☀️';
    }
}

function updateDeadlines() {
    const deadlineElements = document.querySelectorAll('.program-deadline');
    let needsReload = false;
    
    deadlineElements.forEach(element => {
        const card = element.closest('.program-card');
        const programData = JSON.parse(decodeURIComponent(card.dataset.program));
        
        if (programData?.deadline) {
            if (isEventEnded(programData.deadline) && programData.status !== 'completed') {
                needsReload = true;
                return;
            }
            
            const deadlineText = formatDeadline(programData.deadline, programData.opens, programData.ended);
            const deadlineClass = getDeadlineClass(programData.deadline);
            
            element.textContent = deadlineText;
            element.className = `program-deadline ${deadlineClass}`;
        }
    });

    if (needsReload) {
        window.location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    startRender();
    const searchInput = document.getElementById('program-search');
    searchInput.addEventListener('input', (e) => searchPrograms(e.target.value));
    
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            filterPrograms(button.dataset.category);
            searchPrograms(searchInput.value);
        });
    });
    
    initializeTheme();
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    setInterval(updateDeadlines, 60000);

    document.querySelectorAll('.sort-btn').forEach(button => {
        button.addEventListener('click', () => {
            updateSort(button.dataset.sort);
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('.program-completion-toggle')) {
            const button = e.target.closest('.program-completion-toggle');
            const programName = button.dataset.programName;
            toggleProgramCompletion(programName, e);
            return;
        }
        
        if (e.target.closest('.modal-completion-toggle')) {
            const button = e.target.closest('.modal-completion-toggle');
            const programName = button.dataset.programName;
            toggleProgramCompletion(programName, e);
            return;
        }
        
        if (e.target.closest('.program-card') && e.target.closest('a')) {
            return;
        }
        
        if (e.target.closest('.program-card')) {
            const encodedProgram = e.target.closest('.program-card').dataset.program;
            const program = JSON.parse(decodeURIComponent(encodedProgram));
            openModal(program);
        }
        
        if (e.target.closest('.modal-close') || 
            (e.target.classList.contains('modal') && !e.target.closest('.modal-content'))) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('program-modal').classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                closeModal();
                break;
            case 'ArrowLeft':
                navigateModal(-1);
                break;
            case 'ArrowRight':
                navigateModal(1);
                break;
        }
    });

    document.querySelector('.modal-prev').addEventListener('click', () => navigateModal(-1));
    document.querySelector('.modal-next').addEventListener('click', () => navigateModal(1));
});
