# iOS App Store CI

This project can be archived on a remote macOS runner with GitHub Actions.

## GitHub Secrets

Add these secrets in GitHub: `Settings > Secrets and variables > Actions`.

- `APPLE_TEAM_ID`: Apple Developer Team ID.
- `IOS_DISTRIBUTION_CERTIFICATE_BASE64`: base64 of the `.p12` Apple Distribution certificate.
- `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`: password used when exporting the `.p12`.
- `IOS_PROVISIONING_PROFILE_BASE64`: base64 of the App Store provisioning profile for `pt.movvi.app`.
- `IOS_KEYCHAIN_PASSWORD`: any strong temporary password for the CI keychain.

Optional upload-to-App-Store-Connect secrets:

- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_PRIVATE_KEY`

## Create Base64 Values

```bash
base64 -i AppleDistribution.p12 | pbcopy
base64 -i Movvi_AppStore.mobileprovision | pbcopy
```

For the App Store Connect `.p8` key:

```bash
cat AuthKey_XXXXXXXXXX.p8 | pbcopy
```

Paste the full private key contents into `APP_STORE_CONNECT_API_PRIVATE_KEY`.

## Run

Go to `Actions > iOS App Store > Run workflow`.

If this app was already submitted before, enter:

- `marketing_version`: the next app version you want to submit, for example `1.0.5`.
- `build_number`: a number higher than the latest build already uploaded to App Store Connect.

The current App Store Connect build is `1.0.0 (9)`, so the next upload can use:

- `marketing_version`: `1.0.1`
- `build_number`: `10`

If App Store Connect already has a newer build by the time you run the workflow,
increase `build_number` again.

The workflow always uploads the signed `.ipa` as an artifact. If the App Store
Connect API secrets are present, it also uploads the `.ipa` to App Store Connect.

## Notes

- The native iOS project is intentionally committed, while generated web assets
  under `ios/App/App/public` stay ignored and are recreated by `npx cap sync ios`.
- App Store uploads in 2026 require a runner with a recent Xcode/iOS SDK. The
  workflow selects the latest stable Xcode available on the hosted macOS runner.
