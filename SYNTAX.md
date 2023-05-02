Essentially what I want to achieve is something as close as possible to this:

```
Given   a username
and     a correct password
when    submitting those
then    the user is logged in
```

Unfortunately the world isn't perfect. Here are some syntax ideas, with their caveats:

# Option 1: method name based

```
given(aUserName())
and(aCorrectPassword())
when(submittingThose())
then(theUserIsLoggedIn())
```

This follows the "plain text" format quite nicely, and also forces us to not to do too much in each step. After all, everything needs to be done in a separate function.

Now there's a few issues

## Test logs
While the above looks great in code, I wouldn't know how to generate matching test logs for this.
As a slight variation, we could take function arguments and read their names, e.g.:

```
given(aUserName)
// etc.
```

This would allow us to print what we want, as we could read the name from the passed in function.

The drawback is that the callback always must be an argument-less function.

With current testing frameworks, I often end up writing utility functions like this:

```
aTestUser({ firstName: 'Bob', enabled: true })
```

But this doesn't work with the above. We'd need to alias it first:

```
const anEnabledTestUserNamedBob = () => aTestUser({ firstName: 'Bob', enabled: true });
given(anEnabledTestUserNamedBob);
```

## Readability
For longer conditions, camel case really doesn't read nicely. E.g. compare
```
given(anEnabledTestUserNamedBob);
given("an enabled test user named Bob");
```
_maybe snake case is an acceptable option_
```
given(an_enabled_test_user_named_Bob);
given("an enabled test user named Bob");
```

## Variable passing
It's not obvious how this would pass variables from one place to the next.
Clauses should be able to access the variables created in the previous clauses.

The first non-option is that these functions would just return their object, as we wouldn't have any name associated with them. So we have 2 options:
1. Let the clauses themselves creates the names.
  E.g. `an_enabled_test_user_named_Bob` could return `{ user: aTestUser() }`.
2. Add a name through the `given` clause
  E.g. `given(an_enabled_test_user_named_Bob, 'user')`

1. is problematic if 2 clauses use overlapping variable names. E.g. if we have both a `user_named_Alice` and `user_named_Bob` functions that both assign to user, then we have a problem.
2. Just not a fan of the syntax. Maybe some alternatives:
```
given`${an_enabled_test_user_named_Bob} as user`
given(an_enabled_test_user_named_Bob).as('user')
```
(This last one actually isn't too bad)

## Typing
If we want to have typing support, then we'll need to chain methods. E.g.

```
given(an_enabled_test_user_named_Bob).as('user')
  .and(a_valid_password).as('password')
  .when(logging_in)
  .then(the_user_is_logged_in)
```

## Code organisation

The last worry is that the code will be a bit all over the place. With everything filled out, the test will look like this:

```
const an_enabled_test_user_named_Bob = () => createTestUser({ name: 'Bob', enabled: true });
const a_valid_password = ({ user }) => user.password;
const logging_in = ({ user, password }) => login(user, password);
const the_user_is_logged_in = (result) => expect(result).toBeDefined();

given(an_enabled_test_user_named_Bob).as('user')
  .and(a_valid_password).as('password')
  .when(logging_in)
  .then(the_user_is_logged_in);
```

This suddenly isn't as attractive anymore. At best, we're essentially reading the test twice.
At worst, once we're adding more tests in a file, we have a whole bunch of unorganized utilities, and then the actual tests.

This makes it incredibly hard to understand what's actually being tested.

## Them magic

Lastly, the code is quite magical. It's not obvious what's actually being tested without having to jump about multiple places.


# Option 2: Label based

In the JVM world, there's the spock framework that looks pretty amazing. Translated to JS, it would be this:

```
given: "a user named bob";
  const user = createTestUser({ name: 'Bob', enabled: true });
and: "A valid password";
  const password = user.password;
when: "Logging in";
  const res = login(user, password);
then: "The user is logged in";
  expect(res).toBeDefined();
```

This pretty much hits the sweet spot IMO:
- there's a clear given-when-then structure with human readable labels
- the code reads top-to-bottom, no need to jump around to different places
- It's straightforward code, (seemingly) no framework magic.

Unfortunately, it also doesn't work.
In Javascript, labels can't be used like this, and even if it could we couldn't read out from it.

# Option 3: Fake labels

Instead of using actual labels, we can use "fake" labels by using function calls:

```
given("A user named bob");
const user = createTestUser({ name: 'Bob', enabled: true });
and("A valid password");
const password = user.password;
when("Logging in");
const res = login(user, password);
then("The user is logged in";
expect(res).toBeDefined();
```

This is almost as good, but unfortunately it doesn't quite look as great due to the lack of indentation.

This is a hard thing to fix. Normally in JS we only introduce indentation when we also introduce a new scope (loop, function, etc.). But here, we explicitly don't want to create a new scope.

So to let it standout more, we can use some syntax variations:

```
// cap first
Given("A user named bob");
const user = createTestUser({ name: 'Bob', enabled: true });
And("A valid password");
const password = user.password;
When("Logging in");
const res = login(user, password);
Then("The user is logged in";
expect(res).toBeDefined();

// all caps
GIVEN("A user named bob");
const user = createTestUser({ name: 'Bob', enabled: true });
AND("A valid password");
const password = user.password;
WHEN("Logging in");
const res = login(user, password);
THEN("The user is logged in";
expect(res).toBeDefined();

// tagged templates
given`A user named bob`;
const user = createTestUser({ name: 'Bob', enabled: true });
and`A valid password`;
const password = user.password;
when`Logging in`;
const res = login(user, password);
then`The user is logged in`;
expect(res).toBeDefined();
```

While all-caps is the most clear, I also think that it looks absolutely horrendous.
I think that the cap-first has a reasonably good balance of clarity, while not looking like fortran.

# Other ideas

## Callback based

```
// Running into very similar issues as above, and IMHO this is not clear at all
given('a test user', { user: () => createTestUser({ name: 'Bob', enabled: true }) });
and('a password', { password: ({ user }) => user.password });
when('logging in', ({ user, password }) => login(user, password);
then('the user is logged in', (res) => expect(res).toBeDefined());
```

## Tagged templates to the max
I don't even know what's this, or how to make it work
```
given`${aUserNamedBob} as user`
  .and`user.password as password
  .when`login(user, password)`
  .then`expect(res).toBeDefined()`

test`
given ${aUserNamedBob} as user
and ${({ user }} => user.password} as password
when ${({user, password}) => login(user, password)}
then ${(res) => expect(res).toBeDefined()}
```

A common recurring pattern is that for these kind of "clever" constructs we'll need callbacks to link together state.
But callbacks make everything ugly.
