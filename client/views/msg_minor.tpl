<div class="msg action">
	<span class="time" title="{{localetime time}}">
		{{tz time}}
	</span>
	<span class="from"> Attention</span>
	<span class="text">
      {{#if age}}
        <span class="text">
          Vous parlez a un mineur de {{ age }} ans cette conversation est donc placée sous surveillance.<br />
          Si notre système de detection juge que la conversation n'est pas adaptée a l'age de notre utilisateur:<br />
          1) Vous encourez le risque d'être exclu de notre réseau.<br />
          2) Vous encourez le risque que nous declarions votre adresse ip aux autorités françaises.<br />
        </span>
      {{else}}
        <span class="text">
          La personne avec qui vous parlez ne nous a pas informé son age.<br />
          Cette personne est peut etre mineur merci de tenir des propos corrects et à caractère non sexuel.
        </span>
      {{/if}}
    </span>
</div>
