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
        doConfetti();
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
            completionBtn.setAttribute('onClick', isCompleted ? null : "doConfetti()")
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

                if (modalCompletionBtn.classList.contains('completed')) {
                    doConfetti()
                }

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
    const allFilterBtn = document.querySelector('.filter-btn[data-category="all"]');
    if (allFilterBtn) {
        allFilterBtn.click();
    }

    await loadParticipants();
    updateParticipantCounts();
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
                total: getParticipantTotal(item.fields),
                id: item.id
            }));
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
}

function getParticipantTotal(fields) {
    const totalKey = Object.keys(fields || {}).find(key =>
        key.startsWith("Unweighted") && key.endsWith("Total")
    );

    return totalKey ? fields[totalKey] : 0;
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
        const apiData = overrideId ?
            participants.find(p => p.id === overrideId) :
            participants.find(p => p.name === programName);
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
                        ended.push({...program, status: 'ended' });
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
    const forgeClass = program.name === 'Forge' ? 'forge-card' : '';
    const macondoClass = program.name === 'Macondo' ? 'macondo-card' : '';
    const horizonsClass = program.name === 'Horizons' ? 'horizons-card' : '';
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
    const sleepoverClass = program.name === 'Sleepover' ? 'sleepover-card' : '';
    const stasisClass = program.name === 'Stasis' ? 'stasis-card' : '';
    const coeurClass = program.name === 'Cœur' ? 'coeur-card' : '';
    const remixedClass = program.name == "Remixed" ? 'remixed-card' : '';
    const hctgClass = program.name == "Hack Club: The Game" ? 'hctg-card' : '';
    const hackahomeClass = program.name == "Hack a Home" ? 'hackahome-card' : '';
    const KintsugiClass = program.name == "Kintsugi" ? 'kintsugi-card' : '';
    const flaggedClass = program.name == "flagged" ? 'flagged-card' : '';
    const raspapiClass = program.name == "RaspAPI" ? 'raspapi-card' : '';
    const beestClass = program.name == 'Beest' ? 'beest-card' : '';
    const alchemizeClass = program.name === "Alchemize" ? 'alchemize-card' : '';
    const hackanomousClass = program.name === "Hackanomous" ? 'hackanomous-card' : '';
    const shipyardClass = program.name === 'Shipyard' ? 'shipyard-card' : '';
    const stardanceClass = program.name === 'Stardance' ? 'stardance-card' : '';
    const keebClass = program.name === 'Keeb' ? 'keeb-card' : '';
    const insertCoinClass = program.name === 'Insert Coin' ? 'insert-coin-card' : '';
    const isNew = program.opens && (new Date() - new Date(program.opens)) < 7 * 24 * 60 * 60 * 1000;
    const encodedProgram = encodeURIComponent(JSON.stringify(program));
    const polygonClass = program.name === 'Polygon' ? 'polygon-card' : '';

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
        <img src="logos/JusSTUDY.png" alt="Jus'STUDY" class="jusstudy-center">
        <img src="logos/jusstudy-emi.avif" alt="" class="jusstudy-emi">
    ` : '';

    const macondoAssets = program.name === 'Macondo' ? `
        <img src="logos/macondo-background.png" alt="" class="macondo-background" aria-hidden="true">
        <img src="logos/Macondo.png" alt="Macondo" class="macondo-center">
    ` : '';

    const horizonsAssets = program.name === 'Horizons' ? `
        <img src="logos/horizons-bg.webp" alt="" class="horizons-background" aria-hidden="true">
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

    const sleepoverLogo = program.name === 'Sleepover' ? `
        <img src="https://cdn.hackclub.com/019cb51b-3772-71e5-ab48-da8f5c8d2ffa/image.png" alt="Sleepover Logo" class="sleepover-logo">
    ` : '';

    const stasisLogo = program.name === 'Stasis' ? `
        <img src="https://user-cdn.hackclub-assets.com/019cb521-985f-7b28-815c-1512b12b9a63/stasis-logo.png" alt="Stasis Logo" class="stasis-logo">
    ` : '';

    const remixedLogo = program.name == 'Remixed' ? `
        <img src="https://cdn.hackclub.com/019d2613-4fb8-79d6-bc1b-305c41455a73/remixed-logo.png" alt="Remixed Logo" class="remixed-logo">
    ` : '';

    const hctgLogo = program.name == 'Hack Club: The Game' ? `
        <img src="https://cdn.hackclub.com/019d0899-f270-7530-b145-19d1e53f113f/hctg-text-logo.png" alt="Hack Club: The Game" class="hctg-logo">
    ` : '';

    const polygonBg = program.name === 'Polygon' ? `<img src="./logos/Polygon.png" alt="Polygon Background" class="polygon-bg">` : '';

    const raspapiPi = program.name == 'RaspAPI' ? `<img src="https://raspapi.hackclub.com/rpizero-topdown.png" alt="" class="raspapi-pi" aria-hidden="true">` : '';
    const beestSticker = program.name == 'Beest' ? `<img src="logos/beest-sticker.webp" alt="Beest sticker" class="beest-sticker" loading="lazy">` : '';
    const forgeSticker = program.name == 'Forge' ? `<img src="logos/sticker_forge.svg" alt="Forge sticker" class="forge-sticker" loading="lazy">` : '';

    const alchemize = program.name === 'Alchemize' ? `<img src="https://alchemize-ysws.vercel.app/Alchemist.webp" alt="Alchemize Logo" class="alchemize-logo">` : '';
    const alchemizeBg = program.name === 'Alchemize' ? `<img src="./logos/alchemize.png" alt="Alchemize Background" class="alchemize-bg">` : '';

    const shipyardAssets = program.name === 'Shipyard' ? `
        <img src="logos/ShipyardBG.png" alt="" class="shipyard-background" aria-hidden="true">
        <img src="logos/ShipyardLogo.svg" alt="Shipyard" class="shipyard-logo">
    ` : '';

    const stardanceAssets = program.name === 'Stardance' ? `
        <img src="logos/stardance-bg.png" alt="" class="stardance-background" aria-hidden="true">
    ` : '';


    const hackanomousLogo = program.name == 'Hackanomous' ? `<img src="https://cdn.hackclub.com/019d9ecf-46ed-734c-b351-f9c2438d15bf/hackanomous_banner_360p.png" alt="Hackanomous Logo" class="hackanomous-logo">` : '';
    const hackanomousMascot = program.name == 'Hackanomous' ? `<img src="https://cdn.hackclub.com/019d9ef5-f609-7d16-971f-3865d2092604/backanomous_mascot_320p.png" alt="Hackanomous Mascot" class="hackanomous-mascot">` : '';

    const kintsugiBg = program.name == 'Kintsugi' ? `<img src="logos/Kintsugi-bg.jpg" alt="Kintsugi Background" class="kintsugi-bg">` : '';
    const kintsugiMascot = program.name == 'Kintsugi' ? `<img src="logos/Kintsugi-mascot.jpg" alt="Kintsugi Mascot" class="kintsugi-mascot">` : '';


    return `
        <div class="card program-card ${opensClass} ${KintsugiClass} ${forgeClass} ${macondoClass} ${horizonsClass} ${slushiesClass} ${blueprintClass} ${accelerateClass} ${baubleClass} ${meowClass} ${woofClass} ${pxlClass} ${wackyFilesClass} ${flavortownClass} ${jusstudyClass} ${rebootClass} ${kitlabClass} ${sleepoverClass} ${stasisClass} ${coeurClass} ${remixedClass} ${hctgClass} ${hackahomeClass} ${flaggedClass} ${raspapiClass} ${beestClass} ${alchemizeClass} ${hackanomousClass} ${shipyardClass} ${stardanceClass} ${keebClass} ${insertCoinClass} ${polygonClass}" data-program="${encodedProgram}" data-name="${program.name}">
            ${macondoAssets}
            ${horizonsAssets}
            ${shipyardAssets}
            ${stardanceAssets}
            ${kitlabLogo}
            ${kitlabGif}
            ${baubleSnowflakes}
            ${pxlLogo}
            ${sleepoverLogo}
            ${stasisLogo}
            ${remixedLogo}
            ${hctgLogo}
            ${alchemize}
            ${polygonBg}
            ${kintsugiBg}
            ${kintsugiMascot}
            <div class="program-header">
                ${program.name === 'Macondo'
                    ? '<img src="logos/macondo-wordmark.png" alt="Macondo" class="macondo-wordmark">'
                    : program.name === 'Horizons'
                        ? '<img src="logos/horizons-sticker.png" alt="Horizons" class="horizons-wordmark">'
                        : program.name === 'Stardance'
                            ? '<img src="logos/stardance-log.png" alt="Stardance" class="stardance-wordmark">'
                            : program.name === 'Keeb'
                                ? '<img src="logos/keeb_logo.png" alt="Keeb" class="keeb-wordmark">'
                                : program.name === 'Insert Coin'
                                    ? '<img src="logos/InsertCoinLogo.png" alt="Insert Coin" class="insert-coin-wordmark">'
                                    : program.name === 'Polygon'
                                       ? '<img src ="./logos/polygon_logo.png" alt="polygon" class= "polygon-wordmark">'
                                    : `<h3>${program.name}</h3>`}
                <div class="status-container">
                    <span class="user-completed-badge ${isCompletedByUser ? 'visible' : ''}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </span>
                   <span class="program-status status-${program.status}">${program.status}</span>
${isNew ? '<span class="new-badge">NEW</span>' : ''}
                   
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
<button class="program-completion-toggle ${completionButtonClass}" aria-label="${isCompletedByUser ? 'Mark as not completed' : 'Mark as completed'}" data-program-name="${program.name}" onclick="${isCompletedByUser ? '' : 'doConfetti()'}">                    ${completionIcon} 
                </button>
            </div>
            ${flavortownFooter}
            ${jusstudyAssets}
            ${rebootLogo}
            ${raspapiPi}
            ${forgeSticker}
            ${beestSticker}
            ${hackanomousMascot}
           
          
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
    if (visiblePrograms.length > 0 && currentProgramIndex >= 0) {
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

function playModalEntranceAnimation(modal) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        modal.classList.remove('is-animating');
        return;
    }

    const modalContent = modal.querySelector('.modal-content');
    const modalStack = modal.querySelector('.modal-stack');
    if (!modalContent || !modalStack) return;

    const direction = Math.random() < 0.5 ? -1 : 1;
    const enterX = direction * (38 + Math.round(Math.random() * 26));
    const enterY = 18 + Math.round(Math.random() * 16);
    const enterRotate = direction * (3.5 + Math.random() * 4.5);
    const overshootRotate = -direction * (0.8 + Math.random() * 1.2);
    const backOneDirection = Math.random() < 0.5 ? -1 : 1;
    const backTwoDirection = -backOneDirection;
    const backOneX = backOneDirection * (14 + Math.round(Math.random() * 10));
    const backTwoX = backTwoDirection * (18 + Math.round(Math.random() * 14));
    const backOneY = 10 + Math.round(Math.random() * 8);
    const backTwoY = 20 + Math.round(Math.random() * 10);
    const backOneRotate = backOneDirection * (2.2 + Math.random() * 2.4);
    const backTwoRotate = backTwoDirection * (3.2 + Math.random() * 2.8);

    modalContent.style.setProperty('--modal-enter-x', `${enterX}px`);
    modalContent.style.setProperty('--modal-enter-y', `${enterY}px`);
    modalContent.style.setProperty('--modal-enter-rotate', `${enterRotate}deg`);
    modalContent.style.setProperty('--modal-overshoot-rotate', `${overshootRotate}deg`);
    modalStack.style.setProperty('--stack-back-1-x', `${backOneX}px`);
    modalStack.style.setProperty('--stack-back-1-y', `${backOneY}px`);
    modalStack.style.setProperty('--stack-back-1-rotate', `${backOneRotate}deg`);
    modalStack.style.setProperty('--stack-back-2-x', `${backTwoX}px`);
    modalStack.style.setProperty('--stack-back-2-y', `${backTwoY}px`);
    modalStack.style.setProperty('--stack-back-2-rotate', `${backTwoRotate}deg`);

    modal.classList.remove('is-animating');
    void modal.offsetWidth;
    modal.classList.add('is-animating');
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
    modal.querySelector('.program-links').innerHTML = links.join('<span class="link-separator"> | </span>');

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
    playModalEntranceAnimation(modal);
}

function closeModal() {
    const modal = document.getElementById('program-modal');
    const body = document.body;

    modal.classList.remove('active');
    modal.classList.remove('is-animating');
    body.classList.remove('modal-open');
}

function findProgramByName(programName) {
    return Object.values(programs)
        .flat()
        .find(program => program.name === programName);
}

function getLeaderboardProgram(programName, shipCount) {
    const program = findProgramByName(programName);
    if (program) return program;

    const fallbackDescriptions = {
        Daydream: 'Daydream is featured in the YSWS ship rankings, but its full catalog details are not available in the current local dataset.',
        'Campfire Satellites': 'Campfire Satellites is featured in the YSWS ship rankings, but its full catalog details are not available in the current local dataset.',
    };

    const description = fallbackDescriptions[programName] || 'This leaderboard entry is featured in the ship rankings.';

    return {
        name: programName,
        status: 'ended',
        description,
        detailedDescription: `${description} It currently shows ${shipCount.toLocaleString()} shipped projects.`,
        ended: 'Featured on leaderboard',
        steps: [
            'This program appears in the leaderboard, but its detailed catalog card data is not included in this local copy yet.'
        ],
        details: [
            `${shipCount.toLocaleString()} shipped projects are currently shown for this entry.`
        ]
    };
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
        progs.map(p => ({ ...p, category }))
    );

    switch (sortType) {
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

const COLLAPSIBLE_CATEGORIES = new Set(['drafts', 'Ended', 'recentlyEnded']);
const COLLAPSED_VISIBLE_ROWS = 4;
const COLLAPSE_ANIMATION_MS = 480;

function formatCategoryLabel(category) {
    return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function isCollapsibleCategory(category) {
    return COLLAPSIBLE_CATEGORIES.has(category);
}

function getVisibleProgramCards(section) {
    return [...section.querySelectorAll('.program-card')].filter(
        card => !card.classList.contains('hidden-by-filter') && !card.classList.contains('hidden-by-search')
    );
}

function getGridColumnCount(grid) {
    const columns = window.getComputedStyle(grid).gridTemplateColumns;
    if (!columns || columns === 'none') return 1;
    return columns.split(' ').filter(Boolean).length;
}

function getCollapsedVisibleCount(section) {
    const grid = section.querySelector('.programs-grid');
    const cards = getVisibleProgramCards(section);
    if (!grid || cards.length === 0) return 0;

    const columns = Math.max(1, getGridColumnCount(grid));
    return Math.min(cards.length, columns * COLLAPSED_VISIBLE_ROWS);
}

function getCollapsedHeight(section) {
    const wrap = section.querySelector('.programs-grid-wrap');
    const grid = wrap?.querySelector('.programs-grid');
    if (!wrap || !grid) return null;

    const cards = getVisibleProgramCards(section);
    const visibleCount = getCollapsedVisibleCount(section);
    if (cards.length <= visibleCount) return null;

    const gridTop = grid.getBoundingClientRect().top;
    const targetCard = cards[visibleCount - 1];
    return Math.ceil(targetCard.getBoundingClientRect().bottom - gridTop + 9);
}

function updateShowMoreButton(section, expanded) {
    const btn = section.querySelector('.show-more-programs-btn');
    if (!btn) return;

    const label = btn.querySelector('.show-more-label');
    const count = btn.querySelector('.show-more-count');
    const cards = getVisibleProgramCards(section);
    const hiddenCount = Math.max(0, cards.length - getCollapsedVisibleCount(section));
    const categoryLabel = formatCategoryLabel(section.dataset.category).toLowerCase();

    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');

    if (label) {
        label.textContent = expanded ? 'Show less' : `Show all ${categoryLabel}`;
    }
    if (count) {
        count.textContent = hiddenCount > 0 ? `+${hiddenCount} more` : '';
        count.hidden = expanded || hiddenCount <= 0;
    }
}

function updateCollapsibleSection(section) {
    if (section.dataset.animating === 'true') return;

    const wrap = section.querySelector('.programs-grid-wrap');
    const btn = section.querySelector('.show-more-programs-btn');
    const fade = section.querySelector('.programs-grid-fade');
    if (!wrap || !btn) return;

    const cards = getVisibleProgramCards(section);
    const visibleCount = getCollapsedVisibleCount(section);
    if (cards.length <= visibleCount) {
        section.classList.add('collapsible-disabled');
        section.classList.remove('expanded');
        wrap.classList.remove('collapsed');
        wrap.style.maxHeight = '';
        btn.hidden = true;
        return;
    }

    section.classList.remove('collapsible-disabled');
    btn.hidden = section.classList.contains('hidden');

    const expanded = section.classList.contains('expanded');
    updateShowMoreButton(section, expanded);

    if (expanded) {
        wrap.classList.remove('collapsed');
        fade?.classList.add('is-hidden');
        wrap.style.maxHeight = 'none';
        return;
    }

    wrap.classList.add('collapsed');
    fade?.classList.remove('is-hidden');
    const collapsedHeight = getCollapsedHeight(section);
    if (collapsedHeight !== null) {
        wrap.style.maxHeight = `${collapsedHeight}px`;
    }
}

function toggleCollapsibleSection(section) {
    if (section.classList.contains('collapsible-disabled') || section.dataset.animating === 'true') return;

    const wrap = section.querySelector('.programs-grid-wrap');
    const fade = section.querySelector('.programs-grid-fade');
    if (!wrap) return;

    const expanding = !section.classList.contains('expanded');
    const collapsedHeight = getCollapsedHeight(section);
    if (collapsedHeight === null) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        section.classList.toggle('expanded');
        updateCollapsibleSection(section);
        return;
    }

    section.dataset.animating = 'true';
    wrap.style.overflow = 'hidden';

    const finishAnimation = (expanded) => {
        section.dataset.animating = 'false';
        if (expanded) {
            wrap.style.maxHeight = 'none';
        } else {
            wrap.style.maxHeight = `${collapsedHeight}px`;
        }
    };

    if (expanding) {
        const startHeight = wrap.getBoundingClientRect().height;
        section.classList.add('expanded');
        wrap.classList.remove('collapsed');
        fade?.classList.add('is-hidden');
        updateShowMoreButton(section, true);

        wrap.style.maxHeight = `${startHeight}px`;
        requestAnimationFrame(() => {
            wrap.style.maxHeight = `${wrap.scrollHeight}px`;
        });

        const onExpandEnd = (event) => {
            if (event.propertyName !== 'max-height') return;
            clearTimeout(fallbackTimer);
            wrap.removeEventListener('transitionend', onExpandEnd);
            finishAnimation(true);
        };
        const fallbackTimer = setTimeout(() => {
            wrap.removeEventListener('transitionend', onExpandEnd);
            finishAnimation(true);
        }, COLLAPSE_ANIMATION_MS + 80);
        wrap.addEventListener('transitionend', onExpandEnd);
        return;
    }

    const startHeight = wrap.getBoundingClientRect().height;
    section.classList.remove('expanded');
    wrap.classList.add('collapsed');
    fade?.classList.remove('is-hidden');
    updateShowMoreButton(section, false);

    wrap.style.maxHeight = `${startHeight}px`;
    requestAnimationFrame(() => {
        wrap.style.maxHeight = `${collapsedHeight}px`;
    });

    const onCollapseEnd = (event) => {
        if (event.propertyName !== 'max-height') return;
        clearTimeout(fallbackTimer);
        wrap.removeEventListener('transitionend', onCollapseEnd);
        finishAnimation(false);
    };
    const fallbackTimer = setTimeout(() => {
        wrap.removeEventListener('transitionend', onCollapseEnd);
        finishAnimation(false);
    }, COLLAPSE_ANIMATION_MS + 80);
    wrap.addEventListener('transitionend', onCollapseEnd);
}

function refreshCollapsibleSections() {
    requestAnimationFrame(() => {
        document.querySelectorAll('.category-section[data-collapsible="true"]').forEach(updateCollapsibleSection);
    });
}

function renderPrograms() {
    const container = document.getElementById('programs-container');
    const expandedCategories = new Set(
        [...container.querySelectorAll('.category-section.expanded[data-category]')]
            .map(section => section.dataset.category)
    );
    container.innerHTML = '';
    const activeCount = countActivePrograms();
    document.getElementById('active-count').textContent = activeCount;

    if (currentSort === 'default') {
        for (const [category, programsList] of Object.entries(programs)) {
            const section = document.createElement('section');
            const collapsible = isCollapsibleCategory(category);
            section.className = collapsible ? 'category-section collapsible-category' : 'category-section';
            if (collapsible) {
                section.dataset.category = category;
                section.dataset.collapsible = 'true';
                if (expandedCategories.has(category)) {
                    section.classList.add('expanded');
                }
            }

            const categoryLabel = formatCategoryLabel(category);
            const cardsHtml = programsList.map(program => createProgramCard(program)).join('');

            const hiddenCount = Math.max(0, programsList.length - (COLLAPSED_VISIBLE_ROWS * 3));
            const countLabel = hiddenCount > 0 ? `+${hiddenCount} more` : '';

            section.innerHTML = collapsible ? `
                <h2 class="headline">${categoryLabel}</h2>
                <div class="programs-grid-wrap collapsed">
                    <div class="programs-grid">${cardsHtml}</div>
                    <div class="programs-grid-fade" aria-hidden="true"></div>
                </div>
                <div class="show-more-container">
                    <button type="button" class="show-more-programs-btn" aria-expanded="false">
                        <span class="show-more-label">Show all ${categoryLabel.toLowerCase()}</span>
                        <span class="show-more-count"${hiddenCount > 0 ? '' : ' hidden'}>${countLabel}</span>
                        <svg class="show-more-chevron" viewBox="0 0 32 32" aria-hidden="true">
                            <path d="M 0.359841 9.01822C 0.784113 9.37178 1.41467 9.31446 1.76823 8.8902C 3.14518 7.2451 6.52975 3.42464 8.25002 2.11557C 9.99919 3.44663 13.335 7.21555 14.7318 8.8902C 15.0854 9.31446 15.7159 9.37178 16.1402 9.01822C 16.5645 8.66466 16.6215 8.03371 16.2679 7.60943C 14.7363 5.76983 11.2749 1.80977 9.30351 0.408618C 8.99227 0.190441 8.64018 0 8.25002 0C 7.85987 0 7.50778 0.190441 7.19654 0.408618C 5.26486 1.78153 1.73514 5.80788 0.232849 7.60856L 0.231804 7.60982C -0.12176 8.03409 -0.0644362 8.66466 0.359841 9.01822Z" transform="translate(7.12506 20.6251) scale(1 -1)"></path>
                        </svg>
                    </button>
                </div>
            ` : `
                <h2 class="headline">${categoryLabel}</h2>
                <div class="programs-grid">${cardsHtml}</div>
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

    refreshCollapsibleSections();
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

    refreshCollapsibleSections();

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

    refreshCollapsibleSections();
}

function toggleTheme() {
    const body = document.body;

    const isDark = body.classList.toggle('dark-theme');

    localStorage.setItem(
        'theme',
        isDark ? 'dark' : 'light'
    );
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');

    const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
    ).matches;

    if (
        savedTheme === 'dark' ||
        (!savedTheme && prefersDark)
    ) {
        document.body.classList.add('dark-theme');
    }
}

// For timeline
function getEndDate(program) {
    if (program.ended) {
        const date = new Date(program.ended);
        if (!isNaN(date)) return date;
    }

    if (program.deadline && isEventEnded(program.deadline)) {
        return new Date(program.deadline);
    }

    return null;
}

let timelineExpanded = false;
function expandTimeline() {
    const overlay = document.getElementById('timeline-overlay');
    const container = document.getElementById('timeline-container');
    const timelineBtn = document.getElementById('timeline-expand-btn');
    
    container.style.overflow = "hidden";

    if (!timelineExpanded) {
        overlay.style.opacity = "0";
        setTimeout(() => {
            if (timelineExpanded) overlay.style.display = "none";
        }, 400);

        const startHeight = container.getBoundingClientRect().height;
        container.style.maxHeight = `${startHeight}px`;
        requestAnimationFrame(() => {
            container.style.maxHeight = `${container.scrollHeight}px`;
        });
        
        timelineBtn.innerHTML = "<svg fill-rule=\"evenodd\" clip-rule=\"evenodd\" stroke-linejoin=\"round\" stroke-miterlimit=\"1.414\" xmlns=\"http://www.w3.org/2000/svg\" aria-label=\"up-caret\" viewBox=\"0 0 32 32\" preserveAspectRatio=\"xMidYMid meet\" fill=\"currentColor\" width=\"48\" height=\"48\" title=\"up-caret\"><g><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M7.4849 20.3931C7.90917 20.7467 8.53973 20.6894 8.8933 20.2651C10.2702 18.62 13.6548 14.7995 15.3751 13.4905C17.1243 14.8215 20.46 18.5905 21.8569 20.2651C22.2104 20.6894 22.841 20.7467 23.2653 20.3931C23.6895 20.0396 23.7465 19.4086 23.393 18.9843C21.8613 17.1447 18.4 13.1847 16.4286 11.7835C16.1173 11.5653 15.7652 11.3749 15.3751 11.3749C14.9849 11.3749 14.6328 11.5653 14.3216 11.7835C12.3899 13.1564 8.8602 17.1828 7.35791 18.9835L7.35686 18.9847C7.0033 19.409 7.06062 20.0396 7.4849 20.3931Z\"></path></g></svg>";
    } else {
        overlay.style.display = "block";
        setTimeout(() => {
            if (!timelineExpanded) overlay.style.opacity = "1";
        }, 10);
        const startHeight = container.getBoundingClientRect().height;
        container.style.maxHeight = `${startHeight}px`;
        requestAnimationFrame(() => {
            container.style.maxHeight = "25rem";
        });
        
        timelineBtn.innerHTML = "<svg fill-rule=\"evenodd\" clip-rule=\"evenodd\" stroke-linejoin=\"round\" stroke-miterlimit=\"1.414\" xmlns=\"http://www.w3.org/2000/svg\" aria-label=\"down-caret\" viewBox=\"0 0 32 32\" preserveAspectRatio=\"xMidYMid meet\" fill=\"currentColor\" width=\"48\" height=\"48\" title=\"down-caret\"><g><path d=\"M 0.359841 9.01822C 0.784113 9.37178 1.41467 9.31446 1.76823 8.8902C 3.14518 7.2451 6.52975 3.42464 8.25002 2.11557C 9.99919 3.44663 13.335 7.21555 14.7318 8.8902C 15.0854 9.31446 15.7159 9.37178 16.1402 9.01822C 16.5645 8.66466 16.6215 8.03371 16.2679 7.60943C 14.7363 5.76983 11.2749 1.80977 9.30351 0.408618C 8.99227 0.190441 8.64018 0 8.25002 0C 7.85987 0 7.50778 0.190441 7.19654 0.408618C 5.26486 1.78153 1.73514 5.80788 0.232849 7.60856L 0.231804 7.60982C -0.12176 8.03409 -0.0644362 8.66466 0.359841 9.01822Z\" transform=\"translate(7.12506 20.6251) scale(1 -1)\"></path></g></svg>";
    }
    timelineExpanded = !timelineExpanded;
}
function getTimelineEvents() {
    return Object.values(programs).flat().map(program => ({
        ...program,
        endDate: getEndDate(program),
        deadline: program.deadline ? new Date(program.deadline) : null,
    })).sort(
        (a, b) => {
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;

            return a.deadline.getTime() - b.deadline.getTime();
        }
    );
}

function resolveTimelineLabels() {
    document.querySelectorAll(".timeline-row").forEach(row => {
        const block = row.querySelector('.timeline-block');
        const inside = row.querySelector('.timeline-label.inside');
        const outside = row.querySelector(".timeline-label.outside");

        if (!block || !inside || !outside) return;

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

function loadTimelineBlocks() {
    const events = getTimelineEvents();
    const now = new Date();
    const timeline = document.getElementById("timeline");
    const brandingColors = ["#ec3750", "#ff8c37", "#f1c40f", "#33d6a6", "#5bc0de", "#338eda", "#a633d6", "#8492a6"];
    const furthestEvent = events.map(e => e.deadline).filter(Boolean).reduce((max, d) => d > max ? d : max, now);
    const dayContainer = document.getElementById("day-container");
    const monthContainer = document.getElementById("month-container");

    timeline.innerHTML = '';
    dayContainer.innerHTML = '';
    monthContainer.innerHTML = '';

    let cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= furthestEvent) {
        const monthStart = new Date(cursor);
        const month = monthStart.getMonth();
        const year = monthStart.getFullYear();
        const monthEnd = new Date(year, month + 1, 0);

        const start = new Date(Math.max(monthStart.getTime(), now.getTime()));
        const end = new Date(Math.min(monthEnd.getTime(), furthestEvent.getTime()));

        const daysInMonth = Math.ceil((end - start) / 1000 / 60 / 60 / 24 + 1);

        const jan = month === 0;
        const yearShort = String(year).slice(-2);

        const label = jan ? `${monthStart.toLocaleString("default", { month: "short" })} '${yearShort}` : monthStart.toLocaleString("default", { month: "short" });

        monthContainer.innerHTML += `<div class="timeline-month" style="width:${daysInMonth}rem"><span class="month-label">${label}</span></div>`;
        cursor = new Date(year, month + 1, 1);
    }

    for (let i = 0; i < Math.ceil((furthestEvent.getTime() - now.getTime()) / 1000 / 60 / 60 / 24); i++) {
        dayContainer.innerHTML += `<div id="timeline-day-${i}" class="timeline-day"></div>`
    }

    const timelineDays = Math.ceil((furthestEvent.getTime() - now.getTime()) / 1000 / 60 / 60 / 24);
    document.getElementById("timeline-overlay").style.width = `${timelineDays}rem`;

    for (let i = 0; i < events.length; i++) {
        const event = events[i];

        if (event.status !== "ended" && event.status !== "draft") {
            let labelText = event.name;
            let days;
            let width = timelineDays;

            if (event.deadline) {
                days = Math.max(Math.ceil((event.deadline - now) / 1000 / 60 / 60 / 24), 1);

                let remainingDays = days;
                const years = Math.floor(remainingDays / 365);

                remainingDays -= years * 365;

                const months = Math.floor(remainingDays / 30);
                remainingDays -= months * 30;

                width = days;

                const parts = [];

                if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
                if (months > 0) parts.push(`${months} month${months !== 1 ? "s" : ""}`);
                parts.push(`${remainingDays} day${remainingDays !== 1 ? "s" : ""}`)

                labelText += ` - ${parts.join(' ')}`;
            }

            timeline.innerHTML += `
            <div class="timeline-row" data-index="${i}">
                <div class="timeline-block  ${event.deadline ? '' : "no-deadline-timeline"}" style="width:${width}rem; ${event.deadline ? `background-color: ${brandingColors[(i % 8)]}` : `background: linear-gradient(90deg, ${brandingColors[(i % 8)]} 60%, var(--background) 100%);`}">
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

const container = document.getElementById('timeline-container');
    const overlay = document.getElementById('timeline-overlay');
    
    if (container && overlay) {
        container.style.maxHeight = "25rem";
        container.style.overflowY = "hidden";
        overlay.style.display = "block";
    }
    
    setTimeout(resolveTimelineLabels, 100);
}

// ----

function updateDeadlines() {
    const deadlineElements = document.querySelectorAll('.program-deadline');
    let needsReload = false;

    deadlineElements.forEach(element => {
        const card = element.closest('.program-card');
        if (!card) return;
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
}

function initializeFaqAnimations() {
    const faqItems = document.querySelectorAll('.faq-item');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const toggleFaqItem = (item, summary) => {
        if (item.dataset.animating === 'true') return;

        if (reduceMotion.matches) {
            item.open = !item.open;
            return;
        }

        const isOpen = item.open;
        const startHeight = item.offsetHeight;

        item.dataset.animating = 'true';
        item.style.height = `${startHeight}px`;

        if (isOpen) {
            item.classList.add('is-closing');
            const styles = getComputedStyle(item);
            const closedHeight =
                summary.offsetHeight +
                parseFloat(styles.paddingTop) +
                parseFloat(styles.paddingBottom);

            requestAnimationFrame(() => {
                item.style.height = `${closedHeight}px`;
            });

            const finishClose = event => {
                if (event.propertyName !== 'height') return;
                item.removeEventListener('transitionend', finishClose);
                item.open = false;
                item.classList.remove('is-closing');
                item.style.height = '';
                item.dataset.animating = 'false';
            };

            item.addEventListener('transitionend', finishClose);
            return;
        }

        item.open = true;
        item.style.height = `${startHeight}px`;

        requestAnimationFrame(() => {
            item.style.height = `${item.scrollHeight}px`;
        });

        const finishOpen = event => {
            if (event.propertyName !== 'height') return;
            item.removeEventListener('transitionend', finishOpen);
            item.style.height = '';
            item.dataset.animating = 'false';
        };

        item.addEventListener('transitionend', finishOpen);
    };

    faqItems.forEach(item => {
        const summary = item.querySelector('summary');
        if (!summary) return;

        item.addEventListener('click', event => {
            if (event.target.closest('a, button, input, textarea, select, label')) return;
            if (window.getSelection()?.toString()) return;

            event.preventDefault();
            toggleFaqItem(item, summary);
        });

        summary.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;

            event.preventDefault();
            toggleFaqItem(item, summary);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    startRender();
    initializeFaqAnimations();
    window.addEventListener('resize', () => {
        resolveTimelineLabels();
        refreshCollapsibleSections();
    });

    document.getElementById('programs-container').addEventListener('click', (e) => {
        const btn = e.target.closest('.show-more-programs-btn');
        if (btn) {
            toggleCollapsibleSection(btn.closest('.category-section'));
        }
    });

    document.getElementById('leaderboard-container')?.addEventListener('click', (e) => {
        const row = e.target.closest('.leaderboard-row');
        if (!row) return;

        const programName = row.dataset.programName;
        const shipCount = Number(row.dataset.shipCount || 0);
        openModal(getLeaderboardProgram(programName, shipCount));
    });

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

            // Special handling for Stardance card - redirect instead of opening modal
            if (program.name === 'Stardance') {
                window.location.href = 'https://stardance.hackclub.com/ysws-catalog';
                return;
            }

            openModal(program);
        }

        if (e.target.closest('.modal-close') ||
            (e.target.classList.contains('modal') && !e.target.closest('.modal-content'))) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('program-modal').classList.contains('active')) return;

        switch (e.key) {
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


const themeToggle = document.getElementById("theme-toggle");

themeToggle.addEventListener("click", () => {

  document.body.classList.toggle("light-mode");

  if (document.body.classList.contains("light-mode")) {
    themeToggle.innerHTML = "☀";
  } else {
    themeToggle.innerHTML = "☾";
  }

});



// Hold the fetched stats so the count-up animation can wait until the
// stats section actually enters the viewport.
let globalStatsData = null;
let globalStatsAnimated = false;

async function loadGlobalStats() {

  try {
// Endpoint maintained by @natdrone101 on Slack (@zibuyin on Github), source code at https://github.com/zibuyin/YSWS-Catalog-Backend
    const response = await fetch(
      "https://hackclub8080.nathanyin.com/api/v1/ysws_stats"
    );

    if (!response.ok) {
      throw new Error(`Stats request failed with status ${response.status}`);
    }

    globalStatsData = await response.json();

    // If the section is already on screen when data arrives
    // (short page, hash anchor, etc.), animate immediately.
    // Otherwise the IntersectionObserver triggers it on scroll-into-view.
    maybeRunGlobalStatsAnimation();

  } catch (error) {

    console.error(
      "Failed to load stats:",
      error
    );

    globalStatsData = {
      total_projects: 0,
      total_hours: 0,
      total_stars: 0,
      viral_projects: 0
    };

    const localParticipantTotal = Object.values(programs)
      .flat()
      .reduce((total, program) => total + (Number(program.participants) || 0), 0);

    if (localParticipantTotal > 0) {
      globalStatsData.total_projects = localParticipantTotal;
    }

    maybeRunGlobalStatsAnimation();

  }
}

function runGlobalStatsAnimation() {
  if (globalStatsAnimated || !globalStatsData) return;
  globalStatsAnimated = true;

  animateValue("projects-count", globalStatsData.total_projects);
  animateValue("hours-count", globalStatsData.total_hours);
  animateValue("stars-count", globalStatsData.total_stars);
  animateValue("viral-count", globalStatsData.viral_projects);
}

function maybeRunGlobalStatsAnimation() {
  if (globalStatsAnimated || !globalStatsData) return;

  const section = document.querySelector('.global-stats-section');
  if (!section) return;

  const rect = section.getBoundingClientRect();
  const isOnScreen = rect.top < window.innerHeight && rect.bottom > 0;
  if (isOnScreen) runGlobalStatsAnimation();
}

function setupGlobalStatsObserver() {
  const section = document.querySelector('.global-stats-section');
  if (!section) return;

  // Older browsers without IntersectionObserver: just run it so the
  // numbers still show up.
  if (!('IntersectionObserver' in window)) {
    runGlobalStatsAnimation();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        runGlobalStatsAnimation();
        observer.disconnect();
        break;
      }
    }
  }, { threshold: 0.15 });

  observer.observe(section);
}

function formatNumber(num) {

  return new Intl.NumberFormat().format(
    Math.round(num)
  );

}

function animateValue(id, endValue) {

  const element =
    document.getElementById(id);

  let start = 0;

  const duration = 1400;

  const increment =
    endValue / (duration / 16);

  const counter = setInterval(() => {

    start += increment;

    if (start >= endValue) {

      element.textContent =
        formatNumber(endValue);

      clearInterval(counter);

    } else {

      element.textContent =
        formatNumber(Math.floor(start));
    }

  }, 16);
}


window.addEventListener("DOMContentLoaded", () => {
  setupGlobalStatsObserver();
  loadGlobalStats();
})

// const timelineContainer = document.getElementById("timeline-container");
// const dateContainer = document.getElementById("date-container");

// if (timelineContainer && dateContainer)
// {
//     timelineContainer.addEventListener('scroll', () => {
//         dateContainer.style.transform = `translateX(${timelineContainer.scrollLeft}px)`
//     });
// }



const track = document.querySelector('.marquee-track');
let x = 0;
function tick() {
  x -= 0.5;
  if (x <= -(track.scrollWidth / 2)) x = 0;
  track.style.transform = `translateX(${x}px)`;
  requestAnimationFrame(tick);
}
tick();

function loadLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  
  const data = [
    ['Boba Drops', 5150],
    ['High Seas', 3341],
    ['Summer of Making', 2817],
    ['Daydream', 2747],
    ['Campfire Satellites', 2561],
  ];

const medals = [
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="#000">1</text></svg>',
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="#C0C0C0"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="#000">2</text></svg>',
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="#CD7F32"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="#000">3</text></svg>',
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="#172B66"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="#fff">4</text></svg>',
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="#4B5563"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="#fff">5</text></svg>',
  ];

  container.innerHTML = data.map(([name, count], i) => `
    <div class="leaderboard-row" data-program-name="${name}" data-ship-count="${count}">
      <span class="leaderboard-rank">${medals[i]}</span>
      <button
        class="leaderboard-name leaderboard-name-btn"
        type="button"
        aria-label="Open ${name} details"
      >${name}</button>
      <div class="leaderboard-bar-wrap">
        <div class="leaderboard-bar" style="width: ${Math.round((count / data[0][1]) * 100)}%"></div>
      </div>
      <span class="leaderboard-count">${count.toLocaleString()} ships</span>
    </div>
  `).join('');
}

window.addEventListener('DOMContentLoaded', loadLeaderboard);

let wheelPrograms = [];
let wheelAngle = 0;
let spinning = false;

function getWheelPrograms() {
  const colors = ['#ec3750', '#ff8c37', '#f1c40f', '#33d6a6', '#5bc0de', '#338eda', '#a633d6', '#8492a6', '#ec3750', '#33d6a6'];
  const active = Object.values(programs).flat().filter(p => p.status === 'active');
  const shuffled = active.sort(() => Math.random() - 0.5).slice(0, 10);
  return shuffled.map((p, i) => ({ name: p.name, color: colors[i % colors.length] }));
}

function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 220;
  const slice = (2 * Math.PI) / wheelPrograms.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  wheelPrograms.forEach((prog, i) => {
    const start = wheelAngle + i * slice;
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = prog.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Phantom Sans, sans-serif';
    ctx.fillText(prog.name, r - 10, 5);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  ctx.strokeStyle = '#ec3750';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function spinWheel() {
  if (spinning) return;
  spinning = true;

  document.getElementById('wheel-result').classList.add('hidden');
  const btn = document.querySelector('.wheel-spin-btn');
  btn.disabled = true;

  const extraSpins = (5 + Math.random() * 5) * 2 * Math.PI;
  const duration = 4000;
  const start = performance.now();
  const startAngle = wheelAngle;

  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);

    wheelAngle = startAngle + extraSpins * ease;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      btn.disabled = false;
      showWheelResult();
    }
  }

  requestAnimationFrame(animate);
}
function showWheelResult() {
  const slice = (2 * Math.PI) / wheelPrograms.length;
  // Arrow is on the right (3 o'clock = 0 radians)
  // We need to find which slice is at the 3 o'clock position
  const angle = ((-wheelAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const index = Math.floor(angle / slice) % wheelPrograms.length;
  const winner = wheelPrograms[index];

  const result = document.getElementById('wheel-result');
  result.innerHTML = `
    <p>You should try...</p>
    <h3 style="color: ${winner.color}">${winner.name}!</h3>
    <button onclick="document.querySelector('[data-name=\\'${winner.name}\\']')?.click()" class="wheel-open-btn">View Program →</button>
  `;
  result.classList.remove('hidden');
  doConfetti();
}

setTimeout(() => {
  wheelPrograms = getWheelPrograms();
  drawWheel();
}, 2000);

document.addEventListener("DOMContentLoaded", () => {
    const pool = [
      "https://cdn.hackclub.com/019ed762-ea08-7eb2-b8b4-0bc1c26c10d1/screenshot_2026-06-18_015147.png",
      "https://cdn.hackclub.com/019ed762-ed61-7e3f-a9af-6f2de6218eb8/screenshot_2026-06-18_022716.png",
      "https://cdn.hackclub.com/019ed762-f0c7-7f5c-a62d-bf41b8c96a59/screenshot_2026-06-18_022726.png",
      "https://cdn.hackclub.com/019ed762-f3c2-757b-87e9-23be2ce93bd1/screenshot_2026-06-18_022735.png",
      "https://cdn.hackclub.com/019ed762-f69e-721b-924a-3f05a4cd4ec1/screenshot_2026-06-18_022742.png",
      "https://cdn.hackclub.com/019ed762-f9e8-7501-8670-987b07d6344b/screenshot_2026-06-18_022754.png",
      "https://cdn.hackclub.com/019ed762-fc59-7c3f-91db-4dfaee793c98/screenshot_2026-06-18_022801.png",
      "https://cdn.hackclub.com/019ed762-feab-72aa-a042-5a9dcc1a4081/screenshot_2026-06-18_022814.png",
      "https://cdn.hackclub.com/019ed763-01ae-7a18-8834-18f2b9025090/screenshot_2026-06-18_022823.png",
      "https://rework.hackclub.com/thermex.png",
      "https://printboard.hackclub.com/skadis1.png",
      "https://magazine.hackclub.com/_astro/99.DL4SuUSa_1XHsFB.webp",
      "https://magazine.hackclub.com/_astro/82.Bk-ukOYK_ZqF3x4.webp",
      "https://magazine.hackclub.com/_astro/93.DYuWRcNI_ZVhTHj.webp",
      "https://cdn.hackclub.com/019ed763-245a-7da0-952c-81f0a6d786ff/screenshot_2026-06-18_022856.png",
      "https://cdn.hackclub.com/019ed763-26d8-7900-ac8c-d7664fb2562e/screenshot_2026-06-18_022900.png",
      "https://cdn.hackclub.com/019ed763-2997-7e19-b75e-7f61ef8e9eb3/screenshot_2026-06-18_022907.png",
      "https://cdn.hackclub.com/019ed763-2c2b-7497-b860-849d0363f077/screenshot_2026-06-18_022828.png",
      "https://cdn.hackclub.com/019ed763-2fa6-70ff-a69a-c68949afdb54/screenshot_2026-06-18_022843.png",
      "https://cdn.hackclub.com/019ed787-f411-743c-b38e-dedce0fd33fe/dscf5717.jpg",
      "https://cdn.hackclub.com/019ed787-f850-7b33-b703-8e0b9e61c3e9/image.png",
      "https://cdn.hackclub.com/019ed787-ff4c-785c-a680-0218e46c42b3/image.png",
      "https://cdn.hackclub.com/019ed788-02e5-7ca5-848e-d821a17cc9fa/image.png",
      "https://cdn.hackclub.com/019ed788-06da-7b13-a326-9dc427eb87c9/image.png",
      "https://cdn.hackclub.com/019ed788-0b3f-7acc-b254-ad935760c1dd/image.png",
      "https://cdn.hackclub.com/019ed78f-7b00-7c54-adb3-a013770465d6/image.png",
      "https://cdn.hackclub.com/019ed78f-7e66-7962-86ab-dcdbf828a1ea/image.png",
      "https://cdn.hackclub.com/019ed78f-b8fb-77ad-9c78-ffd9a990129d/image.png",
      "https://cdn.hackclub.com/019ed78a-906d-7aa4-aa8c-a56e690bb8bb/image.png",
      "https://cdn.hackclub.com/019ed789-5b83-7c6f-a96e-fe28076696f4/image.png"
    ];

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const frames = document.querySelectorAll(".premium-polaroid");
    
    frames.forEach((frame, idx) => {
      const img = frame.querySelector("img");
      if (img && pool[idx]) {
        img.src = pool[idx];
        
        const randomRotate = Math.floor(Math.random() * 14) - 7;
        frame.style.setProperty('--init-tilt', `${randomRotate}deg`);
        
        img.onload = () => {
          setTimeout(() => {
            frame.classList.add("visible");
          }, idx * 150);
        };

        frame.addEventListener("mousemove", (e) => {
          const rect = frame.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          
          const tiltX = (y * -25).toFixed(2); 
          const tiltY = (x * 25).toFixed(2);  
          
          frame.style.transform = `scale(1.15) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(0deg)`;
        });

        frame.addEventListener("mouseleave", () => {
          frame.style.transform = `scale(1) rotateX(0deg) rotateY(0deg) rotateZ(var(--init-tilt, 0deg))`;
        });
      }
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("timeSlider");
  const eraBadge = document.getElementById("eraBadge");
  
  const eras = {
    2019: { name: "Ancient Era", color: "#6f42c1" }, 
    2020: { name: "Ancient Era", color: "#6f42c1" },
    2021: { name: "Sprig Era", color: "#38d9a9" },   
    2022: { name: "Sprig Era", color: "#38d9a9" },
    2023: { name: "OnBoard Era", color: "#fd7e14" },  
    2024: { name: "High Seas Era", color: "#3b5bdb" }, 
    2025: { name: "Current Era", color: "#ff4757" },  
    2026: { name: "Current Era", color: "#ff4757" }
  };

  function updateTimeline(selectedYear) {
    const currentEra = eras[selectedYear] || eras[2026];
    
    if (eraBadge) {
      eraBadge.innerText = currentEra.name;
      eraBadge.style.backgroundColor = currentEra.color;
      eraBadge.style.boxShadow = `0 0 14px ${currentEra.color}aa`;
    }

    const cards = document.querySelectorAll(".program-card");
    cards.forEach(card => {
      const cardYear = parseInt(card.getAttribute("data-year")) || 2026;
      
      if (cardYear <= selectedYear) {
        card.style.display = "block";
        setTimeout(() => { 
          card.style.opacity = "1"; 
          card.style.transform = "scale(1)"; 
        }, 20);
      } else {
        card.style.opacity = "0";
        card.style.transform = "scale(0.93)";
        setTimeout(() => { 
          card.style.display = "none"; 
        }, 250);
      }
    });
  }

  if (slider) {
    slider.addEventListener("input", (e) => {
      updateTimeline(parseInt(e.target.value));
    });
  }

  window.setSliderYear = function(year) {
    if (slider) {
      slider.value = year;
      updateTimeline(year);
    }
  };
  
  updateTimeline(2026);
});
