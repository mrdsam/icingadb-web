<?php

/* Icinga DB Web | (c) 2020 Icinga GmbH | GPLv2 */

namespace Icinga\Module\Icingadb\Widget\ItemTable;

use Icinga\Module\Icingadb\Common\BaseTableRowItem;
use Icinga\Module\Icingadb\Common\Links;
use Icinga\Module\Icingadb\Model\Servicegroup;
use Icinga\Module\Icingadb\Widget\Detail\ServiceStatistics;
use ipl\Html\Attributes;
use ipl\Html\BaseHtmlElement;
use ipl\Html\HtmlDocument;
use ipl\Html\HtmlElement;
use ipl\Html\Text;
use ipl\Stdlib\Filter;
use ipl\Web\Widget\Link;

/**
 * Servicegroup item of a servicegroup list. Represents one database row.
 *
 * @property Servicegroup $item
 * @property ServicegroupTable $table
 */
class ServicegroupTableRow extends BaseTableRowItem
{
    protected $defaultAttributes = ['class' => 'servicegroup-table-row'];

    protected function init()
    {
        if (isset($this->table)) {
            $this->table->addDetailFilterAttribute($this, Filter::equal('name', $this->item->name));
        }
    }

    protected function assembleColumns(HtmlDocument $columns)
    {
        $serviceStats = new ServiceStatistics($this->item);

        $serviceStats->setBaseFilter(Filter::equal('servicegroup.name', $this->item->name));
        if (isset($this->table) && $this->table->hasBaseFilter()) {
            $serviceStats->setBaseFilter(
                Filter::all($serviceStats->getBaseFilter(), $this->table->getBaseFilter())
            );
        }

        $columns->addHtml($this->createColumn($serviceStats));
    }

    protected function assembleTitle(BaseHtmlElement $title)
    {
        $title->addHtml(
            isset($this->table)
                ? new Link($this->item->display_name, Links::servicegroup($this->item), ['class' => 'subject'])
                : new HtmlElement(
                    'span',
                    Attributes::create(['class' => 'subject']),
                    Text::create($this->item->display_name)
                ),
            new HtmlElement('span', null, Text::create($this->item->name))
        );
    }
}