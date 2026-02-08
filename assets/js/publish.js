/**
 * Jay Libraries - Publish Page
 * Handles business rules display from JSON
 */

(function() {
  'use strict';

  async function initPublishPage() {
    const businessRules = await JayLibraries.fetchJSON('assets/json/businessRules.json');
    
    if (!businessRules) {
      console.error('Failed to load business rules');
      return;
    }

    // Update revenue split if different from hardcoded
    if (businessRules.revenueSplit) {
      document.getElementById('publisher-percentage').textContent = businessRules.revenueSplit.publisher + '%';
      document.getElementById('platform-percentage').textContent = businessRules.revenueSplit.platform + '%';
    }

    // Populate accepted formats
    const formatsContainer = document.getElementById('accepted-formats');
    if (formatsContainer && businessRules.publishing.acceptedFormats) {
      formatsContainer.innerHTML = businessRules.publishing.acceptedFormats.map(format => `
        <div style="padding: 12px 24px; background: var(--gray-950); border: 1px solid var(--gray-800); border-radius: var(--radius); font-weight: 600; color: var(--color-accent);">
          ${format}
        </div>
      `).join('');
    }

    // Populate content guidelines
    const guidelinesContainer = document.getElementById('content-guidelines');
    if (guidelinesContainer && businessRules.publishing.contentGuidelines) {
      guidelinesContainer.innerHTML = businessRules.publishing.contentGuidelines.map(guideline => `
        <li style="display: flex; align-items: start; gap: 12px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>${guideline}</span>
        </li>
      `).join('');
    }

    // Populate legal terms
    const legalContainer = document.getElementById('legal-terms');
    if (legalContainer && businessRules.legal) {
      legalContainer.innerHTML = Object.entries(businessRules.legal).map(([key, value]) => `
        <div style="padding: 24px; background: var(--gray-950); border-left: 3px solid var(--color-accent); border-radius: var(--radius);">
          <h3 style="font-size: 1.125rem; margin-bottom: 8px; text-transform: capitalize;">
            ${key.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          <p style="color: var(--gray-400); font-size: 0.875rem;">${value}</p>
        </div>
      `).join('');
    }
  }

  document.addEventListener('DOMContentLoaded', initPublishPage);

})();
