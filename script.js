const apiUrl = "https://api2.hackclub.com/v0.1/Unified%20YSWS%20Projects%20DB/YSWS%20Programs?cache=true";

let programs = {};
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
    //console.table(getTimelineEvents()); //DEBUG - PLEASE REMOVE LATER
    loadTimelineBlocks();
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
    const slushiesClass = program.name === 'Slushies' ? 'slushies-card' : '';
    const blueprintClass = program.name === 'Blueprint' ? 'blueprint-card' : '';
    const accelerateClass = program.name === 'Accelerate' ? 'accelerate-card' : '';
    const baubleClass = program.name === 'Bauble' ? 'bauble-card' : '';
    const meowClass = program.name === 'Meow' ? 'meow-card' : '';
    const woofClass = program.name === 'Woof' ? 'woof-card' : '';
    const pxlClass = program.name === 'Pxl' ? 'pxl-card' : '';
    const wackyFilesClass = program.name === 'Wacky Files' ? 'wacky-files-card' : '';
    const flavortownClass = program.name === 'Flavortown' ? 'flavortown-card' : '';
    const jusstudyClass = program.name === "Jus'STUDY" ? 'jusstudy-card' : '';
    const rebootClass = program.name === 'Reboot' ? 'reboot-card' : '';
    const kitlabClass = program.name === 'Kit Lab' ? 'kitlab-card' : '';
    const encodedProgram = encodeURIComponent(JSON.stringify(program));
    
    const isCompletedByUser = completedPrograms.has(program.name);
    const completionButtonClass = isCompletedByUser ? 'completed' : '';
    const completionIcon = isCompletedByUser ? 
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : 
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';
    
    const participantsText = program.participants !== undefined ? 
        `<div class="program-participants">${formatParticipants(program.name)}</div>` : '';
    
    const baubleSnowflakes = program.name === 'Bauble' ? `
        <div class="bauble-scene">
            <div class="bauble-flake large f-1"></div>
            <div class="bauble-flake large f-2"></div>
            <div class="bauble-flake large f-3"></div>
            <div class="bauble-flake large f-4"></div>
            <div class="bauble-flake large f-5"></div>
            <div class="bauble-flake large f-6"></div>
            <div class="bauble-flake large f-7"></div>
            <div class="bauble-flake large f-8"></div>
            <div class="bauble-flake f-9"></div>
            <div class="bauble-flake f-10"></div>
            <div class="bauble-flake f-11"></div>
            <div class="bauble-flake f-12"></div>
            <div class="bauble-tree left"><div class="bauble-snow"></div></div>
            <div class="bauble-tree right"><div class="bauble-snow"></div></div>
            <div class="bauble-ground"></div>
        </div>
    ` : '';

    const pxlLogo = program.name === 'Pxl' ? `
        <div class="pxl-logo"></div>
    ` : '';

    const flavortownFooter = program.name === 'Flavortown' ? `
        <img src="logos/flavorfooter.avif" alt="" class="flavortown-footer">
    ` : '';

    const jusstudyAssets = program.name === "Jus'STUDY" ? `
        <img src="logos/jusstudy-emi.avif" alt="" class="jusstudy-mascot">
    ` : '';

    const rebootLogo = program.name === 'Reboot' ? `
        <img src="logos/img_2185-3.png" alt="" class="reboot-logo">
    ` : '';
    const kitlabLogo = program.name === 'Kit Lab' ? `
        <img src="https://user-cdn.hackclub-assets.com/019c6d52-9b38-7999-bc31-5af022597486/logo.png"
         alt="Kit Lab Logo"
         class="kitlab-logo">
    ` : '';

    const kitlabGif = program.name === 'Kit Lab' ? `
        <img src="https://user-cdn.hackclub-assets.com/019c6d52-b2a7-748c-a911-13ceb7095aaf/bg.gif"
         alt=""
         class="kitlab-gif">
    ` : '';

    
    return `
        <div class="card program-card ${opensClass} ${slushiesClass} ${blueprintClass} ${accelerateClass} ${baubleClass} ${meowClass} ${woofClass} ${pxlClass} ${wackyFilesClass} ${flavortownClass} ${jusstudyClass} ${rebootClass} ${kitlabClass}" data-program="${encodedProgram}" data-name="${program.name}">
            ${kitlabLogo}
            ${kitlabGif}
            ${baubleSnowflakes}
            ${pxlLogo}
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
            ${flavortownFooter}
            ${jusstudyAssets}
            ${rebootLogo}
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
        const name = card.dataset.name.toLowerCase();
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

// For timeline
function getEndDate(program){
    if(program.ended){
        const date = new Date(program.ended);
        if (!isNaN(date)) return date;
    }

    if (program.deadline && isEventEnded(program.deadline)) {
        return new Date(program.deadline);
    }

    return null;
}

let timelineExpanded = false;
function expandTimeline(){
    const overlay = document.getElementById('timeline-overlay');
    const container = document.getElementById('timeline-container');
    const timelineBtn = document.getElementById('timeline-expand-btn');
    if (!timelineExpanded){
        overlay.style.display = "none";
        container.style.maxHeight = "none";
        container.style.overflowY = "auto";
        timelineBtn.innerHTML = "<svg fill-rule=\"evenodd\" clip-rule=\"evenodd\" stroke-linejoin=\"round\" stroke-miterlimit=\"1.414\" xmlns=\"http://www.w3.org/2000/svg\" aria-label=\"up-caret\" viewBox=\"0 0 32 32\" preserveAspectRatio=\"xMidYMid meet\" fill=\"currentColor\" width=\"48\" height=\"48\" title=\"up-caret\"><g><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M7.4849 20.3931C7.90917 20.7467 8.53973 20.6894 8.8933 20.2651C10.2702 18.62 13.6548 14.7995 15.3751 13.4905C17.1243 14.8215 20.46 18.5905 21.8569 20.2651C22.2104 20.6894 22.841 20.7467 23.2653 20.3931C23.6895 20.0396 23.7465 19.4086 23.393 18.9843C21.8613 17.1447 18.4 13.1847 16.4286 11.7835C16.1173 11.5653 15.7652 11.3749 15.3751 11.3749C14.9849 11.3749 14.6328 11.5653 14.3216 11.7835C12.3899 13.1564 8.8602 17.1828 7.35791 18.9835L7.35686 18.9847C7.0033 19.409 7.06062 20.0396 7.4849 20.3931Z\"></path></g></svg>";
    }else{
        overlay.style.display = "block";
        container.style.maxHeight = "25rem";
        container.style.overflowY = "hidden";
        timelineBtn.innerHTML = "<svg fill-rule=\"evenodd\" clip-rule=\"evenodd\" stroke-linejoin=\"round\" stroke-miterlimit=\"1.414\" xmlns=\"http://www.w3.org/2000/svg\" aria-label=\"down-caret\" viewBox=\"0 0 32 32\" preserveAspectRatio=\"xMidYMid meet\" fill=\"currentColor\" width=\"48\" height=\"48\" title=\"down-caret\"><g><path d=\"M 0.359841 9.01822C 0.784113 9.37178 1.41467 9.31446 1.76823 8.8902C 3.14518 7.2451 6.52975 3.42464 8.25002 2.11557C 9.99919 3.44663 13.335 7.21555 14.7318 8.8902C 15.0854 9.31446 15.7159 9.37178 16.1402 9.01822C 16.5645 8.66466 16.6215 8.03371 16.2679 7.60943C 14.7363 5.76983 11.2749 1.80977 9.30351 0.408618C 8.99227 0.190441 8.64018 0 8.25002 0C 7.85987 0 7.50778 0.190441 7.19654 0.408618C 5.26486 1.78153 1.73514 5.80788 0.232849 7.60856L 0.231804 7.60982C -0.12176 8.03409 -0.0644362 8.66466 0.359841 9.01822Z\" transform=\"translate(7.12506 20.6251) scale(1 -1)\"></path></g></svg>";
    }
    timelineExpanded = !timelineExpanded;
}

function getTimelineEvents(){
    return Object.values(programs).flat().map(program => ({
        ...program,
        endDate: getEndDate(program),
        deadline: program.deadline?new Date(program.deadline):null,
    })).sort(
        (a, b) => {
            if(!a.deadline && !b.deadline) return 0;
            if(!a.deadline) return 1;
            if(!b.deadline) return -1;

            return a.deadline.getTime() - b.deadline.getTime();
        }
    );
}

function resolveTimelineLabels(){
    document.querySelectorAll(".timeline-row").forEach(row => {
        const block = row.querySelector('.timeline-block');
        const inside = row.querySelector('.timeline-label.inside');
        const outside = row.querySelector(".timeline-label.outside");

        if(!block || !inside || !outside) return;

        // for measure width (width is 0 when display:none)
        outside.classList.remove("hidden");
        inside.classList.remove("hidden");
        if (inside.scrollWidth > block.clientWidth) {
            inside.classList.add("hidden");
        } else {
            outside.classList.add("hidden");
        }
    })
}

function loadTimelineBlocks(){
    const events = getTimelineEvents();
    const now = new Date();
    const timeline = document.getElementById("timeline");
    const brandingColors = ["#ec3750","#ff8c37","#f1c40f","#33d6a6", "#5bc0de", "#338eda", "#a633d6", "#8492a6"];
    const furthestEvent = events.map(e => e.deadline).filter(Boolean).reduce((max,d) => d > max ? d : max, now);
    const dayContainer = document.getElementById("day-container");
    const monthContainer = document.getElementById("month-container");

    timeline.innerHTML = '';

    let cursor = new Date(now);
    cursor.setHours(0,0,0,0);

    while(cursor <= furthestEvent){
        const monthStart = new Date(cursor);
        const month = monthStart.getMonth();
        const year = monthStart.getFullYear();
        const monthEnd = new Date(year, month + 1,0);

        const start = new Date(Math.max(monthStart.getTime(), now.getTime()));
        const end = new Date(Math.min(monthEnd.getTime(), furthestEvent.getTime()));

        const daysInMonth = Math.ceil((end-start)/1000/60/60/24+1);

        const jan = month === 0;
        const yearShort = String(year).slice(-2);

        const label = jan ? `${monthStart.toLocaleString("default", {month: "short"})} '${yearShort}` : monthStart.toLocaleString("default", {month: "short"});

        monthContainer.innerHTML += `<div class="timeline-month" style="width:${daysInMonth}rem"><span class="month-label">${label}</span></div>`;
        cursor = new Date(year, month +1, 1);
    }

    for(let i=0; i < Math.ceil((furthestEvent.getTime() - now.getTime())/1000/60/60/24); i++){
        dayContainer.innerHTML += `<div id="timeline-day-${i}" class="timeline-day"></div>`
    }

    document.getElementById("timeline-overlay").style.width = `${Math.ceil((furthestEvent.getTime() - now.getTime())/1000/60/60/24)}rem`;

    for(let i=0; i<events.length; i++){
        const event = events[i];

        if (event.status !== "ended" && event.status !== "draft"){
            let labelText = event.name;
            let days;
            let width;

            if(event.deadline){
                days = Math.max(Math.ceil((event.deadline-now)/1000/60/60/24),1);

                let remainingDays = days;
                const years = Math.floor(remainingDays/365);

                remainingDays -= years*365;

                const months = Math.floor(remainingDays/30);
                remainingDays -= months*30;

                width = days;

                const parts = [];

                if(years>0) parts.push(`${years} year${years!== 1?"s":""}`);
                if(months>0) parts.push(`${months} month${months!== 1?"s":""}`);
                parts.push(`${remainingDays} day${remainingDays!==1?"s":""}`)

                labelText += ` - ${parts.join(' ')}`;
            }

            timeline.innerHTML += `
            <div class="timeline-row" data-index="${i}">
                <div class="timeline-block  ${event.deadline ? '' : "no-deadline-timeline"}" style="width:${width}rem; ${event.deadline ? `background-color: ${brandingColors[(i%8)]}` : `background: linear-gradient(90deg, ${brandingColors[(i%8)]} 40%, var(--background) 95%);`}">
                    <span class="timeline-label inside">${labelText}</span>
                </div>
                <span class="timeline-label outside hidden">${labelText}</span>
            </div>
            `;
        }
    }

    document.querySelectorAll('.timeline-row').forEach(row => {
        row.addEventListener('click', () => {
            const i = Number(row.dataset.index);
            const event = events[i];

            openModal(event);
        })
    })

    requestAnimationFrame(resolveTimelineLabels);
}

// ----

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
    window.addEventListener('resize', resolveTimelineLabels);

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
