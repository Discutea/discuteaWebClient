{{#if account}}
  <p>Compte: {{account}}</p>
{{/if}}
{{#if channels}}
  <p>Salons: {{{parse channels}}}</p>
{{/if}}
{{#if server}}
  <p>Serveur: {{server}}</p>
{{/if}}
{{#if secure}}
  <p>Connexion sécurisée</p>
{{/if}}
{{#if away}}
  <p><i>({{away}})</i></p>
{{/if}}
