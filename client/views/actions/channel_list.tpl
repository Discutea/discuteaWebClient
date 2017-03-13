<div class="table-responsive">
  <table id="channels" class="table channel-list">
    <thead>
        <tr>        
            <th class="channel">{{ trans 'action_channel_list_channel' locale }}</th>
            <th class="users">{{ trans 'action_channel_list_users' locale }}</th>
            <th class="topic">{{ trans 'action_channel_list_topic' locale }}</th>
        </tr>
    </thead>
    <tbody class="channelslist">
        {{#each channels}}
            <tr>
                <td class="channel">{{{parse channel}}}</td>
                <td class="users">{{num_users}}</td>
                <td class="topic">{{{parse topic}}}</td>
            </tr>
        {{/each}}
    </tbody>
  </table>
</div>
