/*
Reader likes. Readers do not log in.
*/

const VISITOR_KEY = "kpt-emag-visitor";

/*
A random ID this browser keeps, so a like counts once per
browser. It identifies a browser, not a person.
*/
export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }

    return id;
  } catch (error) {
    // Private mode etc.: a one-off ID for this page view
    return crypto.randomUUID();
  }
}
