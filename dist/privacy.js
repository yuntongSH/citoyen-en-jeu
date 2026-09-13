const settings=window.CITOYEN_CONFIG || {};
if(settings.accountsEnabled) document.querySelector('#account-availability').textContent='Les comptes e-mail permettent de retrouver votre progression sur plusieurs appareils.';
if(settings.privacyContact) document.querySelector('#privacy-contact').textContent=settings.privacyContact;
