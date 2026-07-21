# Spaces navigation search design

## Goal
Remove the unused header options button from the Spaces panel and make the search icon filter the local Space navigation tree.

## Interaction
- The Spaces header keeps Search, Collapse, and Create controls; the three-dot header control is removed.
- Clicking Search reveals a focused search field below the header.
- Matching is case-insensitive and covers Space, Folder, List, and Doc names.
- A matching child keeps its parent Space and Folder visible. Matching branches are expanded while searching.
- Selecting any visible result keeps the existing navigation behavior. Clearing or closing search restores the normal tree.

## Data and accessibility
The search derives results from the existing `spaces` local state and writes no data. The input has an explicit accessible name and Escape clears/closes it.

## Tests
Add an interaction test proving that a nested List can be found by search, its hierarchy stays visible, and the header options button is absent.