// Maps the partners.html interest checkboxes onto the brief's lead-scoring table.
// Never used to auto-reject a lead — scoring only affects lead_priority for triage.
const INTEREST_POINTS = {
  sponsorship: 5,
  exhibition: 5,
  technology_showcase: 5,
  skills_careers: 5,
  esg_sdg_activation: 4,
  competition_tournament: 4,
  workshop_education: 4,
  media_partnership: 3,
  community_partnership: 3,
  youth_engagement: 3,
  speaking_thought_leadership: 3,
  other: 2,
};

export function computeLeadScoreDelta(interests) {
  if (!Array.isArray(interests)) return 0;
  return interests.reduce((total, key) => total + (INTEREST_POINTS[key] || 0), 0);
}
