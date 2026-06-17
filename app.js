// ── Fraction lookup table ─────────────────────────────────────────────────────
const FRACTIONS = [
    [1/8, '⅛'], [1/4, '¼'], [1/3, '⅓'], [1/2, '½'],
    [2/3, '⅔'], [3/4, '¾'],
    [1, '1'], [1+1/4, '1¼'], [1+1/3, '1⅓'], [1+1/2, '1½'],
    [1+2/3, '1⅔'], [1+3/4, '1¾'],
    [2, '2'], [2.5, '2½'], [3, '3'], [3.5, '3½'],
    [4, '4'], [5, '5'], [6, '6'], [7, '7'], [8, '8']
];

// ── Metric conversion maps ────────────────────────────────────────────────────
const METRIC_UNIT = {
    'cup': 'ml', 'cups': 'ml',
    'tbsp': 'ml', 'tablespoon': 'ml', 'tablespoons': 'ml',
    'tsp': 'ml', 'teaspoon': 'ml', 'teaspoons': 'ml',
    'fl oz': 'ml', 'fl_oz': 'ml',
    'oz': 'g', 'ounce': 'g', 'ounces': 'g',
    'lb': 'g', 'lbs': 'g', 'pound': 'g', 'pounds': 'g'
};

const METRIC_FACTOR = {
    'cup': 240, 'cups': 240,
    'tbsp': 15, 'tablespoon': 15, 'tablespoons': 15,
    'tsp': 5, 'teaspoon': 5, 'teaspoons': 5,
    'fl oz': 29.57, 'fl_oz': 29.57,
    'oz': 28.35, 'ounce': 28.35, 'ounces': 28.35,
    'lb': 453.6, 'lbs': 453.6, 'pound': 453.6, 'pounds': 453.6
};

// ── Default ingredients ───────────────────────────────────────────────────────
let ingredients = [
    { name: 'All-purpose flour', amount: '2', unit: 'cups' },
    { name: 'Sugar',             amount: '1', unit: 'cup'  },
    { name: 'Eggs',              amount: '3', unit: ''     },
    { name: 'Butter',            amount: '0.5', unit: 'cups' },
];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const ingList      = document.getElementById('ingredient-list');
const resultsList  = document.getElementById('results-list');
const resultsCard  = document.getElementById('results-card');
const origInput    = document.getElementById('original-servings');
const targetInput  = document.getElementById('target-servings');
const badge        = document.getElementById('factor-badge');
const useFrac      = document.getElementById('use-fractions');
const useMetric    = document.getElementById('use-metric');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Snap a number to a friendly fraction string if close enough, else toFixed(2) */
function toFraction(n) {
    const best = FRACTIONS.reduce((a, b) =>
        Math.abs(b[0] - n) < Math.abs(a[0] - n) ? b : a
    );
    return Math.abs(best[0] - n) < 0.07 ? best[1] : n.toFixed(2);
}

/** Format an amount for display */
function formatAmount(n, fractions) {
    if (isNaN(n) || n === 0) return '';
    if (fractions) return toFraction(n);
    const r = Math.round(n * 100) / 100;
    return r % 1 === 0 ? String(r) : r.toFixed(2);
}

// ── Render ingredient input rows ──────────────────────────────────────────────
function renderIngredients() {
    ingList.innerHTML = '';
    ingredients.forEach((ing, i) => {
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        row.innerHTML = `
            <input type="text"   class="ingredient-name"   placeholder="e.g. Flour"  value="${ing.name}"   data-i="${i}" data-field="name">
            <input type="text"   class="ingredient-amount" placeholder="Amount"       value="${ing.amount}" data-i="${i}" data-field="amount">
            <input type="text"   class="ingredient-unit"   placeholder="Unit"         value="${ing.unit}"   data-i="${i}" data-field="unit">
            <button class="del-btn" data-del="${i}" aria-label="Remove ingredient">
                <i class="ti ti-x"></i>
            </button>
        `;
        ingList.appendChild(row);
    });
}

// ── Update the scaling badge ──────────────────────────────────────────────────
function updateBadge() {
    const orig = parseFloat(origInput.value) || 4;
    const tgt  = parseFloat(targetInput.value) || 4;
    const f    = tgt / orig;

    if (Math.abs(f - 1) < 0.001) {
        badge.textContent = '1× scale';
        badge.className   = 'factor-badge factor-same';
    } else if (f > 1) {
        badge.textContent = `${Math.round(f * 100) / 100}× scale`;
        badge.className   = 'factor-badge factor-up';
    } else {
        badge.textContent = `${Math.round(f * 100)}% of original`;
        badge.className   = 'factor-badge factor-down';
    }
}

// ── Scale & render results ────────────────────────────────────────────────────
function scaleRecipe() {
    const orig = parseFloat(origInput.value);
    const tgt  = parseFloat(targetInput.value);

    if (!orig || !tgt || orig <= 0 || tgt <= 0) {
        alert('Please enter valid serving sizes greater than 0.');
        return;
    }

    const factor   = tgt / orig;
    const fracs    = useFrac.checked;
    const metric   = useMetric.checked;

    resultsList.innerHTML = '';

    ingredients.forEach(ing => {
        if (!ing.name && !ing.amount) return;

        const origAmt  = parseFloat(ing.amount);
        let scaledAmt  = isNaN(origAmt) ? null : origAmt * factor;
        let unit       = ing.unit;

        // Convert to metric if requested
        if (metric && unit && METRIC_FACTOR[unit.toLowerCase().trim()] && scaledAmt !== null) {
            const key  = unit.toLowerCase().trim();
            scaledAmt  = scaledAmt * METRIC_FACTOR[key];
            unit       = METRIC_UNIT[key];
        }

        const origDisp   = isNaN(origAmt) ? '—' : formatAmount(origAmt, fracs);
        const scaledDisp = scaledAmt === null ? '—' : formatAmount(scaledAmt, fracs && !metric);

        const row = document.createElement('div');
        row.className = 'result-row';
        row.innerHTML = `
            <span class="result-name">${ing.name || '—'}</span>
            <span class="result-orig">${origDisp}</span>
            <span class="result-new">${scaledDisp}</span>
            <span class="result-unit">${unit || ''}</span>
        `;
        resultsList.appendChild(row);
    });

    resultsCard.style.display = 'block';
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Event: live-edit ingredient fields ───────────────────────────────────────
ingList.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.field) {
        ingredients[+el.dataset.i][el.dataset.field] = el.value;
    }
});

// ── Event: delete ingredient row ──────────────────────────────────────────────
ingList.addEventListener('click', e => {
    const btn = e.target.closest('[data-del]');
    if (btn) {
        ingredients.splice(+btn.dataset.del, 1);
        renderIngredients();
        resultsCard.style.display = 'none';
    }
});

// ── Event: add ingredient row ─────────────────────────────────────────────────
document.getElementById('add-ingredient-btn').addEventListener('click', () => {
    ingredients.push({ name: '', amount: '', unit: '' });
    renderIngredients();
    // Focus the new name field
    const rows = ingList.querySelectorAll('.ingredient-row');
    rows[rows.length - 1].querySelector('input').focus();
});

// ── Event: reset ──────────────────────────────────────────────────────────────
document.getElementById('reset-btn').addEventListener('click', () => {
    targetInput.value = origInput.value;
    updateBadge();
    resultsCard.style.display = 'none';
});

// ── Event: scale ──────────────────────────────────────────────────────────────
document.getElementById('scale-recipe-btn').addEventListener('click', scaleRecipe);

// ── Event: re-scale when toggles change (if results are visible) ──────────────
[useFrac, useMetric].forEach(el => {
    el.addEventListener('change', () => {
        if (resultsCard.style.display !== 'none') scaleRecipe();
    });
});

// ── Event: update badge live ──────────────────────────────────────────────────
origInput.addEventListener('input', updateBadge);
targetInput.addEventListener('input', updateBadge);

// ── Init ──────────────────────────────────────────────────────────────────────
renderIngredients();
updateBadge();