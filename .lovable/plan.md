## Completed: Game Results, Season Types & Manager Role

### What was done
- Added **manager** role to `app_role` enum (managers join via team code like players, but can edit calendar events and results)
- Added `game_result` (win/loss/null) and `is_regular_season` (boolean) columns to `calendar_events`
- Created `recalc_season_record` trigger that auto-updates `teams.season_wins/losses` from regular-season game results
- Updated calendar UI: coaches/managers see Win/Loss/No Result buttons and Regular Season checkbox on game events
- Players see read-only result badges
- Calendar grid shows green dots for wins, red dots for losses
- Updated signup flow to include manager role option
- Updated RLS policies to allow managers to manage calendar events
