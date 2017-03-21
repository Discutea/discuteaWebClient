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
        {{#each data.channels}}
            <tr>
                <td class="channel">{{{parse data.channel}}}</td>
                <td class="users">{{data.num_users}}</td>
                <td class="topic">{{{parse data.topic}}}</td>
            </tr>
        {{/each}}
    </tbody>
  </table>
</div>
