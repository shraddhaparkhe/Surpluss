# Findings

## Original assessment application

No defects in the original application are claimed. Only the assessment brief and product README were supplied; the source code and its seeded bugs were not. The tests in this folder verify requirements implemented in this reconstruction. They are not failing regression tests for the original app, so Task 1 remains unassessed.

## Reconstruction limitation (not an original-app finding)

**Enquiries and catalogue mutations are not durable.** The prototype keeps its data in a process-global in-memory store.

- **Reproduce:** Start the app, submit a buyer enquiry, stop the development server, restart it, sign into `/admin/leads`, and observe the empty inbox.
- **Expected:** Enquiry history and catalogue changes survive an application restart.
- **Impact:** High for production use because leads can be lost and catalogue edits silently disappear. This is a known prototype limitation, not a verified defect in Surpluss's application.
- **Automated regression:** Not supplied. A meaningful persistence regression test requires replacing the in-memory store with a durable database; adding a test that merely asserts process-memory behavior would not verify the desired guarantee.