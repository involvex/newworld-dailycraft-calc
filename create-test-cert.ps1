# Create a self-signed certificate for code signing (development/testing only)
# This will create a certificate in the Windows certificate store and export it to a PFX file

$certName = "CN=Involvex Test Certificate"
$password = "testpassword123"
$pfxPath = "test-cert.pfx"

# Create self-signed certificate
$cert = New-SelfSignedCertificate -Subject $certName -Type CodeSigningCert -KeyUsage DigitalSignature -FriendlyName "Involvex Test Code Signing" -CertStoreLocation Cert:\CurrentUser\My

# Export to PFX file
$securePassword = ConvertTo-SecureString -String $password -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $securePassword

Write-Host "Test certificate created: $pfxPath"
Write-Host "Password: $password"
Write-Host ""
Write-Host "Update your .env file with:"
Write-Host "CSC_LINK=$pfxPath"
Write-Host "CSC_KEY_PASSWORD=$password"
Write-Host ""
Write-Host "Note: This is a self-signed certificate for testing only."
Write-Host "Users will still see security warnings when installing the application."
