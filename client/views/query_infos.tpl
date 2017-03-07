<div class="first">
  {{#if operator}}
    <p class="admin tooltipped tooltipped-n" aria-label="Administrateur sur discutea">
      Administrateur
    </p>
  {{/if}}
  {{#if helpop}}
    <p class="helper tooltipped tooltipped-n" aria-label="Apte a l'aide">
      Helpeur
    </p>
  {{/if}}
  {{#if account}}
    <p class="vip tooltipped tooltipped-n" aria-label="Inscrit sous {{account}}">
      V.I.P
    </p>
  {{/if}}
  
  <p>
    {{#if sex}}
      <span class="{{ sex }}">{{ sex }}</span>, 
    {{/if}}
    {{#if age}}
      {{ age }} ans
    {{/if}}
  </p>

  {{#if loc}}
    <p>{{loc}}</p>
  {{/if}}
</div>

{{#if channels}}
  <p>Salons:</p>
  <p>{{{parse channels}}}</p>
{{/if}}
{{#if away}}
  <p>Absent</p>
  <p><i>({{away}})</i></p>
{{/if}}
