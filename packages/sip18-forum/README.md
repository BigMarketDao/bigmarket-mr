# sip18-forum

Quick start forum compatible with Stacks SIP-018 structured messages.

Main components;

- UI [sip18-forum](https://github.com/BigMarketDao/sip18-forum)
- Backend [sip18-forum-api](https://github.com/BigMarketDao/sip18-forum-api)
- Types [sip18-forum-types](https://github.com/BigMarketDao/sip18-forum-types)

See also [stacks voice](https://github.com/Clarity-Innovation-Lab/stacks-voice)

## TODO

1. ~~BNS Names~~
2. ~~Verified markers~~
3. Integration (BigMarket)
4. Hosted demo
5. Nostr back end

## Developing

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

## Packaging

To build the package and push to npm

```bash
npm run package
cd dist
cp ../package.json .
npm publish --access public
```
