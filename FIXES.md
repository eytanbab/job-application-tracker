- [x] "Quick Update Status" rerenders the form each keystroke when changing custom stage detail (FIXED: Decoupled quick status input state from currentApp and removed currentApp.status from history refetch useEffect dependencies).
- [x] The search functionality in `/applications` does not work properly. For example, searching for a company doesn't show all the results containing this company name.
- [x] Updating the status category does not update the stage details in the edit application form. If a user changes the status category from "Applied" to any other status, the stage details stays on apply.
- [x] On mobile view - Applications page, it is almost impossible to press the "Next" button as the FAB is covering it (FIXED: Added pb-24 bottom clearance to grid container on mobile).
- [x] On mobile view - Applications page, "Rows per page" is overflowing and can be 2-3 lines (FIXED: Reorganized pagination controls into responsive stacked rows on mobile).
- [x] On mobile view - Applications page - Viewing application, the role name is not in the center as it has pr-6 on its parent div (FIXED: Removed asymmetric pr-6 from header flex wrapper).
- [x] On mobile view - Applications page - Viewing application, external link button is too close to the 'X' button (FIXED: Added mr-8 margin to separate action button from modal close button).
- [x] In Applications page - Viewing application, the 'quick update status' can be confusing for users who will not understand why the status shows twice (FIXED: Added explicit Stage Category and Custom Stage Detail labels with contextual placeholders).
- [x] In Applications page - Editing application, the stage details / custom status text size in the input is not in the same size as the reset of the inputs in the form (FIXED: Added className="h-9 text-xs" to stage details input).

