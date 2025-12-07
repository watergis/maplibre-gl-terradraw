# Contributing Guidelines

This document contains a set of guidelines to help developers during the contribution process.

## Development

### Download and install dependencies

```shell
git clone git@github.com:watergis/maplibre-gl-terradraw.git
cd maplibre-gl-terradraw
pnpm i
```

When you download the repository first time, please also install `lefthook` by the following command.

```shell
pnpm lefthook install
```

### Set Protomaps API key

This documentation uses Protomaps as basemap, please get your API key from https://protomaps.com/api, and set it to `PROTOMAP_KEY` on `.env`.

```shell
cp .env.example .env
```

### Run locally

```shell
pnpm dev
```

### Build

Both packages and documentation are built by the below command.

```shell
pnpm build
```

Output files for the package are generated under `package` folder. The demo website will be exported under `dist` folder.

If you want to check typedoc documentation, please execute the following command to update them under `/docs` folder. The typedoc documentation is deployed to GitHub pages by CI.

```shell
pnpm typedoc
pnpm typedoc:serve # open port 3000
```

### Test

Install playwright browser, then execute test scripts.

```shell
pnpm exec playwright install --with-deps
```

```shell
pnpm test
```

Read more about playwright [here](https://playwright.dev/docs/intro)

### Update dependency graph

Install [graphviz](https://graphviz.org/download/), then execute the following command.

```shell
pnpm depcruise
```

## Release packages

It uses changeset to release. Please create release notes by the following command. Changeset will release package once the PR is merged into main branch.

```zsh
pnpm changeset
```

## How to make a pull request

1. [Fork the repo](https://help.github.com/articles/fork-a-repo) and create a branch for your new feature or bug fix.

2. Install NPM packages by `pnpm install && pnpm lefthook install`.

3. Run the plugins to check all of plugin's features work well. Run: `pnpm dev`

4. Make sure you submit a change specific to exactly one issue. If you have ideas for multiple changes please create separate pull requests.

5. Make prettier pass. Run: `pnpm format`

6. Make eslint pass. Run: `pnpm lint`

7. Add a changeset file by `pnpm changeset`

8. Commit local changes in git. Run: `git add . && git commit -m "precise commit message"

9. Push local branch to your forked remote repository.

10. Push to your fork and [submit a pull request](https://help.github.com/articles/using-pull-requests). A button should appear on your fork its github page afterwards.
